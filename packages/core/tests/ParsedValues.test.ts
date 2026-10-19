import { describe, expect, it, vi } from 'vitest';
import { booleanType } from '@ja-platform/parser-type-system';
import { parse } from '@journeyapps/common-xml';
import {
  AbstractValueProvider,
  XMLParseEvent,
  ParsedAttribute,
  ParsedNode,
  ParsedProviderValue,
  ParsedValue,
  ParserDefaultValueProvider,
  V5Attribute,
  V5Node,
  V5NumberAttribute,
  V5TextAttribute,
  V5TextArrayAttribute,
  V5BooleanAttribute
} from '../src';

class MutableProvider extends AbstractValueProvider {
  readonly values = new Map<ParsedAttribute, ParsedProviderValue<any>>();
  created = 0;

  constructor(
    private readonly initial: unknown,
    private readonly initiallyActive = true
  ) {
    super();
  }

  protected createProviderValue<T>(attribute: ParsedAttribute): ParsedProviderValue<T> {
    this.created++;
    const value = new ParsedProviderValue<T>({
      value: this.initial as T,
      active: this.initiallyActive,
      provider: this
    });
    this.values.set(attribute, value);
    return value;
  }
}

function setup(defaultValue: unknown = 'default') {
  const definition = new V5Node({ name: 'item' });
  definition.addAttribute(new V5Attribute(V5Attribute.TYPE, { name: 'value', defaultValue }));
  const event: XMLParseEvent<ParsedNode> = {
    element: parse('<item />').documentElement,
    scope: {} as XMLParseEvent<ParsedNode>['scope'],
    helper: { pushError: () => {} }
  };
  const node = definition.parseTree({ event });
  return { node, attribute: node.attribute('value') };
}

describe('Parsed values', () => {
  it('parses resolved numbers with the same type used for literal attributes', () => {
    const definition = new V5Node({ name: 'item' });
    definition.addAttribute(new V5NumberAttribute({ name: 'count' }));
    const node = definition.parseTree({
      event: {
        element: parse('<item count="$:count" />').documentElement,
        scope: {} as XMLParseEvent<ParsedNode>['scope'],
        helper: { pushError: () => {} }
      }
    });
    const attribute = node.attribute('count');
    const provider = new MutableProvider('045');
    const value = new ParsedValue<number>(attribute, [provider]);
    expect(value.current).toBe(45);
    provider.values.get(attribute).setValue('1e3');
    expect(value.current).toBe(1000);
    expect(() => provider.values.get(attribute).setValue('not a number')).toThrow(SyntaxError);
    expect(value.current).toBe(1000);
    value.dispose();
  });

  it.each(['Hello {{name}}', '$:getLabel()'])('converts resolved text values while preserving source %j', (source) => {
    const definition = new V5Node({ name: 'item' });
    definition.addAttribute(new V5TextAttribute({ name: 'label' }));
    const node = definition.parseTree({
      event: {
        element: parse(`<item label="${source}" />`).documentElement,
        scope: {} as XMLParseEvent<ParsedNode>['scope'],
        helper: { pushError: () => {} }
      }
    });
    const attribute = node.attribute('label');
    const provider = new MutableProvider(45);
    const value = new ParsedValue<string>(attribute, [provider]);
    expect(value.current).toBe('45');
    expect(attribute.stringify().value).toBe(source);
    provider.values.get(attribute).setValue(false);
    expect(value.current).toBe('false');
    value.dispose();
  });

  it.each([
    ['false', false],
    ['0', false],
    ['45', true],
    ['', false],
    ['present', true],
    [{}, true],
    [[], true]
  ])('converts resolved condition %j to %j', (input, expected) => {
    const definition = new V5Node({ name: 'item' });
    definition.addAttribute(new V5BooleanAttribute({ name: 'show-if', key: 'showIf' }));
    const node = definition.parseTree({
      event: {
        element: parse('<item show-if="$:getValue()" />').documentElement,
        scope: {} as XMLParseEvent<ParsedNode>['scope'],
        helper: { pushError: () => {} }
      }
    });
    const value = new ParsedValue<boolean>(node.attribute('showIf'), [new MutableProvider(input)]);
    expect(value.current).toBe(expected);
    value.dispose();
  });

  it('honors an explicitly selected boolean type instead of applying condition truthiness', () => {
    const attribute = new V5BooleanAttribute({ name: 'enabled', valueType: booleanType });
    expect(attribute.normalizeValue('false')).toBe(false);
    expect(() => attribute.normalizeValue('present')).toThrow(SyntaxError);
  });

  it('keeps text arrays as arrays and uses their configured delimiter', () => {
    const definition = new V5Node({ name: 'item' });
    definition.addAttribute(new V5TextArrayAttribute({ name: 'tags', delimiter: ';' }));
    const node = definition.parseTree({
      event: {
        element: parse('<item tags="first;second" />').documentElement,
        scope: {} as XMLParseEvent<ParsedNode>['scope'],
        helper: { pushError: () => {} }
      }
    });
    const attribute = node.attribute('tags');
    const provider = new MutableProvider('first;second');
    const value = new ParsedValue<string[]>(attribute, [provider]);
    expect(value.current).toEqual(['first', 'second']);
    const tags = ['third', 'fourth'];
    provider.values.get(attribute).setValue(tags);
    expect(value.current).toBe(tags);
    value.dispose();
  });

  it('notifies value and activity changes independently', () => {
    const contribution = new ParsedProviderValue({ value: 'first', active: false });
    const changed = vi.fn();
    const activeChanged = vi.fn();
    contribution.registerListener({ changed, activeChanged });
    contribution.setValue('second');
    expect(contribution.active).toBe(false);
    expect(changed).toHaveBeenCalledWith('second');
    expect(activeChanged).not.toHaveBeenCalled();
    contribution.setActive(true);
    expect(contribution.current).toBe('second');
    expect(activeChanged).toHaveBeenCalledWith(true);
    expect(changed).toHaveBeenCalledTimes(1);
    contribution.setValue('second');
    contribution.setActive(true);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(activeChanged).toHaveBeenCalledTimes(1);
    contribution.dispose();
    expect(activeChanged).toHaveBeenLastCalledWith(false);
    contribution.setActive(true);
    contribution.setValue('disposed');
    expect(changed).toHaveBeenCalledTimes(1);
    expect(activeChanged).toHaveBeenCalledTimes(2);
  });

  it('keeps ordered contributions subscribed while activity chooses the last active value', () => {
    const { attribute } = setup();
    const defaults = new ParserDefaultValueProvider();
    const config = new MutableProvider('config', false);
    const expression = new MutableProvider('watched');
    const value = new ParsedValue<string>(attribute, [defaults, config, expression]);
    const changed = vi.fn();
    value.registerListener({ changed });
    const configValue = config.values.get(attribute);
    const expressionValue = expression.values.get(attribute);
    expect(value.providerValues).toHaveLength(3);
    expect(value.current).toBe('watched');
    expect(value.activeValue).toBe(expressionValue);

    configValue.setValue('new config');
    expect(changed).not.toHaveBeenCalled();
    expressionValue.setActive(false);
    expect(value.current).toBe('default');
    configValue.setActive(true);
    expect(value.current).toBe('new config');
    expressionValue.setActive(true);
    expect(value.current).toBe('watched');
    expect(changed.mock.calls.map(([current]) => current)).toEqual(['default', 'new config', 'watched']);
    expect(expression.created).toBe(1);
    expect(value.providerValues).toContain(expressionValue);
    value.release();
  });

  it('updates the cached winner without emitting when the resolved value stays equal', () => {
    const { attribute } = setup();
    const first = new MutableProvider('same');
    const second = new MutableProvider('same');
    const value = new ParsedValue<string>(attribute, [first, second]);
    const changed = vi.fn();
    value.registerListener({ changed });
    second.values.get(attribute).setActive(false);
    expect(value.activeValue).toBe(first.values.get(attribute));
    second.values.get(attribute).setActive(true);
    expect(value.activeValue).toBe(second.values.get(attribute));
    expect(changed).not.toHaveBeenCalled();
    value.release();
  });

  it.each([null, false, 0, '', undefined])('allows an explicitly active contribution containing %j', (current) => {
    const { attribute } = setup();
    const source = new MutableProvider(current);
    const value = new ParsedValue(attribute, [new ParserDefaultValueProvider(), source]);
    expect(value.activeValue).toBe(source.values.get(attribute));
    expect(value.current).toBe(current);
    source.values.get(attribute).setActive(false);
    expect(value.current).toBe('default');
    value.release();
  });

  it('normalizes only the winning contribution and serves reads from the cache', () => {
    const { attribute } = setup();
    const normalize = vi.spyOn(attribute.definition, 'normalizeValue').mockImplementation(Number);
    const first = new MutableProvider('2');
    const second = new MutableProvider('7');
    const value = new ParsedValue<number>(attribute, [first, second]);
    expect(value.current).toBe(7);
    expect(value.current).toBe(7);
    expect(normalize).toHaveBeenCalledTimes(1);
    expect(normalize).toHaveBeenCalledWith('7');
    const changed = vi.fn();
    value.registerListener({ changed });
    second.values.get(attribute).setValue(7);
    expect(changed).not.toHaveBeenCalled();
    second.values.get(attribute).setValue('8');
    second.values.get(attribute).setActive(false);
    expect(changed.mock.calls.map(([current]) => current)).toEqual([8, 2]);
    value.release();
  });

  it('shares resolved values between node consumers until their last release', () => {
    const { node, attribute } = setup();
    const source = new MutableProvider('first');
    node.setValueProviders([source]);
    const first = node.value(['value']);
    const second = node.value(['value']);
    const contribution = source.values.get(attribute);
    const disposed = vi.fn();
    contribution.registerListener({ disposed });
    expect(source.created).toBe(1);
    first.dispose();
    contribution.setValue('second');
    expect(first.current).toEqual({ value: 'first' });
    expect(second.current).toEqual({ value: 'second' });
    expect(disposed).not.toHaveBeenCalled();
    second.dispose();
    expect(disposed).toHaveBeenCalledTimes(1);
    const next = node.value(['value']);
    expect(source.created).toBe(2);
    expect(source.values.get(attribute)).not.toBe(contribution);
    next.dispose();
  });

  it('retains a resolved value while consumers still need its contributions', () => {
    const { attribute } = setup();
    const source = new MutableProvider('first');
    const value = new ParsedValue(attribute, [source]);
    value.retain();
    value.retain();
    const contribution = source.values.get(attribute);
    const disposed = vi.fn();
    contribution.registerListener({ disposed });
    value.release();
    contribution.setValue('second');
    expect(value.current).toBe('second');
    expect(disposed).not.toHaveBeenCalled();
    value.release();
    value.release();
    expect(disposed).toHaveBeenCalledTimes(1);
  });

  it('publishes activity changes through node projections and stops updates after disposal', () => {
    const { node, attribute } = setup();
    const provider = new MutableProvider('first');
    node.setValueProviders([provider]);
    const value = node.value(['value']);
    const changed = vi.fn();
    value.registerListener({ changed });
    const contribution = provider.values.get(attribute);
    contribution.setActive(false);
    expect(value.current).toEqual({});
    contribution.setValue('hidden');
    expect(changed).toHaveBeenCalledTimes(1);
    contribution.setActive(true);
    expect(value.current).toEqual({ value: 'hidden' });
    value.dispose();
    contribution.setValue('disposed');
    expect(value.current).toEqual({ value: 'hidden' });
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it('falls back when a contributing provider is disposed while the resolved value is still observed', () => {
    const { attribute } = setup();
    const source = new MutableProvider('watched');
    const value = new ParsedValue<string>(attribute, [new ParserDefaultValueProvider(), source]);
    const changed = vi.fn();
    value.registerListener({ changed });
    source.dispose();
    expect(value.current).toBe('default');
    expect(changed).toHaveBeenCalledWith('default');
    expect(value.providerValues).toHaveLength(2);
    value.release();
  });
});
