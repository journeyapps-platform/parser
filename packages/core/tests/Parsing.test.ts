import { describe, expect, it, vi } from 'vitest';
import { parse } from '@journeyapps/common-xml';
import { numberType, textType } from '@ja-platform/parser-type-system';
import { ConstantExpression, ConstantExpressionParser } from '@ja-platform/parser-expressions';
import {
  ConstantExpressionValueProvider,
  ParsedArrayNode,
  ParsedValue,
  ParserDefaultValueProvider,
  V5Attribute,
  V5Node,
  V5BooleanAttribute,
  V5ConstantTextAttribute,
  V5ContentNode,
  V5ExpressionAttribute,
  V5NodeAlternatives,
  V5NumberAttribute,
  V5TextAttribute
} from '../src';

const scope = { getReference: () => null };

function parseDocument(definition: V5Node, source: string) {
  return definition.parseTree({
    event: { element: parse(source).documentElement, helper: { pushError: vi.fn() } },
    valueProviders: [new ConstantExpressionValueProvider()]
  });
}

describe('Shared XML parsing', () => {
  it.each(
    [undefined, null, false, 0, '', { light: 'literal', small: 'literal' }, ['one', 'two']].map((defaultValue) => ({
      defaultValue
    }))
  )('resolves literal defaults without engine policy: %j', ({ defaultValue }) => {
    const definition = new V5Node({ name: 'settings' });
    definition.addAttribute(new V5Attribute(V5Attribute.TYPE, { name: 'value', defaultValue }));
    const node = parseDocument(definition, '<settings />');
    const provider = new ParserDefaultValueProvider();
    const value = new ParsedValue(node.attribute('value'), [provider]);
    expect(value.current).toBe(defaultValue);
    expect(value.providerValues[0].active).toBe(defaultValue !== undefined);
    value.dispose();
    provider.dispose();
  });

  it('composes attributed child nodes and runs their parsing listeners', () => {
    const definition = new V5Node({ name: 'settings' });
    const child = new V5Node({ name: 'item', key: 'items', isMultiple: true });
    child.addAttribute(new V5ConstantTextAttribute({ name: 'label' }));
    const postParse = vi.fn();
    child.registerListener({ postParse });
    definition.addNode(child);

    const node = parseDocument(definition, '<settings><item label="First" /><item label="Second" /></settings>');
    const value = node.valueTree();
    expect(value.current).toEqual({ items: [{ label: 'First' }, { label: 'Second' }] });
    expect(postParse).toHaveBeenCalledTimes(2);
    expect(node.validate({ scope })).toEqual([]);
    value.dispose();
  });

  it('parses numeric and boolean attributes without an engine or schema context', () => {
    const definition = new V5Node({ name: 'settings' });
    definition.addAttributes([
      new V5NumberAttribute({ name: 'count', range: { min: 1, max: 10 } }),
      new V5BooleanAttribute({ name: 'enabled' })
    ]);
    const node = parseDocument(definition, '<settings count="4" enabled="true" />');
    const value = node.valueTree();
    expect(value.current).toEqual({ count: 4, enabled: true });
    expect(node.validate({ scope })).toEqual([]);
    value.dispose();

    const invalid = parseDocument(definition, '<settings count="12" enabled="false" />');
    expect(invalid.validate({ scope })).toEqual([
      expect.objectContaining({ message: expect.stringContaining('outside of allowable range [1, 10]') })
    ]);
    expect(invalid.errors({ deep: true })).toEqual([]);

    const malformed = parseDocument(definition, '<settings count="invalid" />');
    expect(malformed.attribute('count').expression()).toBeNull();
    expect(malformed.errors({ deep: true })).toHaveLength(1);
  });

  it('retains repeated scalar content and validates required children', () => {
    const definition = new V5Node({ name: 'settings' });
    definition.addNode(
      new V5ContentNode({ name: 'count', key: 'counts', isMultiple: true, isRequired: true, valueType: numberType })
    );
    definition.addNode(
      new V5NodeAlternatives({
        key: 'label',
        exclusive: true,
        alternatives: [
          new V5ContentNode({ name: 'title', valueType: textType }),
          new V5ContentNode({ name: 'caption', valueType: textType })
        ]
      })
    );
    const node = parseDocument(definition, '<settings><count>2</count><count>3</count><title>Hello</title></settings>');
    const value = node.valueTree();
    expect(value.current).toEqual({ counts: [2, 3], label: 'Hello' });
    expect(node.node('counts')).toBeInstanceOf(ParsedArrayNode);
    expect(node.validate({ scope })).toEqual([]);
    value.dispose();

    const invalid = parseDocument(definition, '<settings><caption>World</caption></settings>');
    expect(invalid.validate({ scope })).toEqual([
      expect.objectContaining({ message: "<count> must contain at least one '<count/>'" })
    ]);
  });

  it('supports expression validation and editor helpers through consumer-supplied interfaces', () => {
    const definition = new V5Node({ name: 'settings' });
    definition.addAttributes([
      new V5ExpressionAttribute({ name: 'source' }),
      new V5ConstantTextAttribute({ name: 'label' }),
      new V5TextAttribute({ name: 'description', syntax: new ConstantExpressionParser(textType) })
    ]);
    const node = parseDocument(definition, '<settings source="missing" label="Title" description="Details" />');
    expect(node.attribute('label').expression()).toBeInstanceOf(ConstantExpression);
    expect(node.validate({ scope })).toEqual([
      expect.objectContaining({ message: expect.stringContaining('missing') })
    ]);
    expect(
      new V5NumberAttribute({ name: 'count' }).getEditorV5Syntax({
        typedBindingOrFunction: (options) => options.types
      } as Parameters<V5NumberAttribute['getEditorV5Syntax']>[0])
    ).toEqual(['number']);
    expect(
      new V5ExpressionAttribute({ name: 'source' }).getEditorV5Syntax({
        typedBindingOrFunction: (options) => options
      } as Parameters<V5ExpressionAttribute['getEditorV5Syntax']>[0])
    ).toEqual({ types: null, writable: false, constants: false });
  });
});
