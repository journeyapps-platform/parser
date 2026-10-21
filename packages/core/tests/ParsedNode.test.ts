import { describe, expect, it, vi } from 'vitest';
import { UnknownType, numberType, NumberType } from '@ja-platform/parser-type-system';
import { ConstantExpression, FunctionExpression } from '@ja-platform/parser-expressions';
import * as xml from '@journeyapps/common-xml';
import {
  ParsedAttribute,
  ParsedArrayNode,
  ParseTreeOptions,
  NodeAlternatives,
  Attribute,
  FunctionAttribute,
  Node,
  XMLParseEvent,
  ParsedNode,
  TextAttribute,
  ConstantTextAttribute,
  ConstantBooleanAttribute,
  NumberAttribute,
  BooleanAttribute,
  ParserDefaultValueProvider,
  ConstantExpressionValueProvider
} from '../src';
class AlternativeItemsParser extends Node {
  constructor() {
    super({ name: 'items', key: 'items' });
    this.addNode(
      new NodeAlternatives({
        key: 'items',
        alternatives: [new StaticItemParser(), new QueryItemParser()]
      })
    );
  }
}

class StaticItemParser extends Node {
  constructor() {
    super({ name: 'item', key: 'items', isMultiple: true });
    this.addAttribute(new TextAttribute({ name: 'label' }));
  }

  protected shouldParse(options: ParseTreeOptions): boolean {
    return xml.getAttribute(options.event.element, 'query') == null;
  }
}

class QueryItemParser extends Node {
  constructor() {
    super({ name: 'item', key: 'items', isMultiple: true });
    this.addAttribute(new TextAttribute({ name: 'query' }));
  }

  protected shouldParse(options: ParseTreeOptions): boolean {
    return xml.getAttribute(options.event.element, 'query') != null;
  }
}

class TableParser extends Node {
  constructor() {
    super({ name: 'table' });
    this.addAttributes([
      new ConstantTextAttribute({ name: 'id' }),
      new TextAttribute({ name: 'label' }),
      new ConstantBooleanAttribute({ name: 'enabled' })
    ]);
    const column = new Node({ name: 'column', key: 'columns', isMultiple: true });
    column.addAttribute(new Attribute(Attribute.TYPE, { name: 'name' }));
    this.addNode(column);
    const detail = new Node({ name: 'detail' });
    detail.addAttribute(new Attribute(Attribute.TYPE, { name: 'code' }));
    this.addNode(detail);
  }
}
class NestedParser extends Node {
  constructor() {
    super({ name: 'nested' });
    this.addAttribute(new TextAttribute({ name: 'title' }));
  }
}
function createEvent(
  source: string,
  scope: any = {},
  helperOverrides: Partial<XMLParseEvent<ParsedNode>['helper']> = {}
): XMLParseEvent<ParsedNode> {
  const document = xml.parse(source);
  if (document.errors?.length) {
    throw new Error(document.errors.map((error) => error.toString()).join('\n'));
  }

  return {
    element: document.documentElement,
    scope,
    helper: {
      pushError: ({ element: _element, message }) => {
        throw new Error(message);
      },
      ...helperOverrides
    }
  };
}

describe('ParsedNode', () => {
  it('keeps directly registered validation hooks local to each parsed instance and allows removal', () => {
    const parser = new Node({ name: 'item' });
    parser.addAttribute(new ConstantTextAttribute({ name: 'label' }));
    const first = parser.parseTree({ event: createEvent('<item label="First" />') });
    const second = parser.parseTree({ event: createEvent('<item label="Second" />') });
    const remove = first.registerListener({
      postValidation({ node, context }) {
        context.report({
          token: node.attribute('label').expression().tokens[0],
          message: 'Only the first instance'
        });
      }
    });
    const context = { scope: { getReference: () => new UnknownType() } };
    expect(first.validate(context).map((diagnostic) => diagnostic.message)).toEqual(['Only the first instance']);
    expect(second.validate(context)).toEqual([]);
    remove();
    expect(first.validate(context)).toEqual([]);
  });

  it('parses explicitly typed constants and resolves their typed values', () => {
    const parser = new Node({ name: 'param' });
    parser.addAttribute(new ConstantTextAttribute({ name: 'name' }));
    parser.addAttribute(new ConstantBooleanAttribute({ name: 'required' }));

    const parsed = parser.parseTree({ event: createEvent('<param name="item" required="true" />') });
    const nameExpression = parsed.attribute('name').expression();
    const requiredExpression = parsed.attribute('required').expression();

    expect(nameExpression).toBeInstanceOf(ConstantExpression);
    expect(nameExpression.value()).toBe('item');
    expect(requiredExpression).toBeInstanceOf(ConstantExpression);
    expect(requiredExpression.value()).toBe(true);
    parsed.setValueProviders([new ConstantExpressionValueProvider()]);
    const values = parsed.value(['name', 'required']);
    expect(values.current).toEqual({ name: 'item', required: true });
    values.dispose();
  });

  it('parses numbers explicitly, preserves their spelling and reports invalid input at the attribute', () => {
    const parser = new Node({ name: 'item' });
    const range = Object.freeze({ min: 0 });
    const number = new NumberAttribute({ name: 'sort', range });
    parser.addAttribute(number);
    const parsed = parser.parseTree({ event: createEvent('<item sort="045" />') });
    expect(parsed.attribute('sort').expression().value()).toBe(45);
    expect(parsed.attribute('sort').stringify().value).toBe('045');
    expect(number.normalizeValue('045')).toBe(45);
    expect(() => number.normalizeValue('45px')).toThrow(SyntaxError);
    for (const source of ['45px', 'Infinity']) {
      const reported: unknown[] = [];
      const parsed = parser.parseTree({
        event: createEvent(
          `<item sort="${source}" />`,
          {},
          {
            pushError: ({ element }) => reported.push(element)
          }
        )
      });
      expect(parsed.attribute('sort').errors()).toHaveLength(1);
      expect(reported).toHaveLength(1);
      expect(reported[0]).toMatchObject({ name: 'sort', value: source });
    }
    expect(range).toEqual({ min: 0 });
    const outsideRange = parser.parseTree({ event: createEvent('<item sort="-1" />') });
    const scope = { getReference: () => new UnknownType() };
    expect(outsideRange.errors({ deep: true })).toEqual([]);
    expect(outsideRange.validate({ scope })).toEqual([
      {
        token: outsideRange.attrExpression('sort').tokens[0],
        message: 'item: Attribute sort="-1" is outside of allowable range [0, Infinity].'
      }
    ]);
  });

  it('parses a selected constant type once and uses it again for resolved values', () => {
    const parse = vi.fn(numberType.parse);
    const valueType = Object.assign(new NumberType(), { parse });
    const parser = new Node({ name: 'item' });
    const number = new NumberAttribute({ name: 'count', valueType });
    parser.addAttribute(number);
    const parsed = parser.parseTree({ event: createEvent('<item count="045" />') });
    expect(parsed.attribute('count').expression().value()).toBe(45);
    expect(parse.mock.calls).toEqual([['045']]);
    expect(number.normalizeValue('1e3')).toBe(1000);
    expect(parse.mock.calls).toEqual([['045'], ['1e3']]);
  });

  it('does not normalize null parser defaults into concrete values', () => {
    const parser = new Node({ name: 'column' });
    parser.addAttribute(new BooleanAttribute({ name: 'show-if', key: 'showIf', defaultValue: null }));
    parser.addAttribute(new BooleanAttribute({ name: 'hide-if', key: 'hideIf', defaultValue: null }));
    parser.addAttribute(new BooleanAttribute({ name: 'enabled', defaultValue: null }));
    const parsed = parser.parseTree({ event: createEvent('<column enabled="true" />') });
    parsed.setValueProviders([new ParserDefaultValueProvider(), new ConstantExpressionValueProvider()]);

    expect(parsed.value(['showIf', 'hideIf', 'enabled']).current).toEqual({
      showIf: null,
      hideIf: null,
      enabled: true
    });
  });

  it('reports invalid boolean syntax while allowing omission, constants, references and evaluated code', () => {
    const parser = new Node({ name: 'column' });
    parser.addAttribute(new BooleanAttribute({ name: 'show-if' }));
    for (const source of [
      '<column />',
      '<column show-if="true" />',
      '<column show-if="false" />',
      '<column show-if="user.active" />',
      '<column show-if="$:null" />',
      '<column show-if="$:save(null)" />'
    ]) {
      const parsed = parser.parseTree({ event: createEvent(source) });
      expect(parsed.attribute('show-if').errors()).toEqual([]);
    }
    for (const value of ['null', ' null ', 'true false', 'user.']) {
      const reported: string[] = [];
      const parsed = parser.parseTree({
        event: createEvent(
          `<column show-if="${value}" />`,
          {},
          {
            pushError: ({ element: _element, message }) => reported.push(message)
          }
        )
      });
      const attribute = parsed.attribute('show-if');
      expect(attribute.expression()).toBeNull();
      expect(attribute.errors()).toHaveLength(1);
      expect(reported).toEqual(['Expected a boolean or finite number.']);
    }
  });

  it('validates boolean references after parsing while deferring evaluated conditions', () => {
    const parser = new Node({ name: 'item' });
    parser.addAttribute(new BooleanAttribute({ name: 'show-if' }));
    for (const source of [null, 'true', 'false', 'active', '$:isActive()']) {
      const parsed = parser.parseTree({
        event: createEvent(source == null ? '<item />' : `<item show-if="${source}" />`)
      });
      const expression = parsed.attribute('show-if').expression();
      const getReference = vi.fn((): UnknownType | null => null);
      const diagnostics = parsed.validate({ scope: { getReference } });
      expect(parsed.errors({ deep: true })).toEqual([]);
      if (source === 'active') {
        expect(diagnostics[0].token).toBe(expression.codeToken);
        expect(diagnostics.map((diagnostic) => diagnostic.message)).toEqual(["'active' is not defined"]);
        expect(getReference).toHaveBeenCalledWith(['active']);
      } else {
        expect(diagnostics).toEqual([]);
        expect(getReference).not.toHaveBeenCalled();
      }
    }
  });

  it('skips parsing and validation for absent text attributes', () => {
    const syntax = { tryParse: vi.fn(), parse: vi.fn() };
    const validateFormatAttribute = vi.fn();
    const parser = new Node({ name: 'item' });
    parser.addAttribute(new TextAttribute({ name: 'title', syntax }));
    const parsed = parser.parseTree({
      event: createEvent('<item />', {}, { validateFormatAttribute })
    });

    expect(parsed.attribute('title').expression()).toBeNull();
    expect(syntax.parse).not.toHaveBeenCalled();
    expect(validateFormatAttribute).not.toHaveBeenCalled();
  });

  it('reports invalid prefixed text on its attribute instead of treating it as literal text', () => {
    const reported: unknown[] = [];
    const parsed = new NestedParser().parseTree({
      event: createEvent('<nested title="$:broken(" />', {}, { pushError: ({ element }) => reported.push(element) })
    });
    const attribute = parsed.attribute('title');

    expect(attribute.expression()).toBeNull();
    expect(attribute.errors()).toHaveLength(1);
    expect(reported).toHaveLength(1);
    expect(reported[0]).toMatchObject({ name: 'title', value: '$:broken(' });
  });

  it('preserves prefixed text expressions and reports validation separately', () => {
    const validations: string[] = [];
    const expressions: unknown[] = [];
    const parser = new NestedParser();
    const parsed = parser.parseTree({
      event: createEvent(
        '<nested title="$:refresh()" />',
        {},
        {
          validateFormatAttribute: ({ element: _element, attribute: attr, scope: _scope, expression }) => {
            validations.push(attr);
            expressions.push(expression);
          }
        }
      )
    });

    const attribute = parsed.attribute('title');
    expect(attribute.expression()).toBeInstanceOf(FunctionExpression);
    expect(attribute.expression().raw()).toBe('$:refresh()');
    expect(attribute.expression().code()).toBe('refresh()');
    expect(attribute.stringify().value).toBe('$:refresh()');
    expect(validations).toEqual(['title']);
    expect(expressions).toHaveLength(1);
    expect(expressions[0]).toBe(attribute.expression());
  });
  it('runs validation hooks around descendants and returns fresh diagnostics independently of parsing', () => {
    const parser = new Node({ name: 'parent' });
    const child = new Node({ name: 'child' });
    parser.addAttribute(new ConstantTextAttribute({ name: 'label' }));
    child.addAttribute(new BooleanAttribute({ name: 'show-if' }));
    parser.addNode(child);
    const calls: string[] = [];
    parser.registerListener({
      postParse({ parsed }) {
        parsed.registerListener({
          preValidation({ node, context }) {
            calls.push('parent:pre');
            context.report({ token: node.attribute('label').expression().tokens[0], message: 'Before' });
          },
          postValidation({ node, context }) {
            calls.push('parent:post');
            context.report({ token: node.attribute('label').expression().tokens[0], message: 'After' });
          }
        });
      }
    });
    child.registerListener({
      postParse({ parsed }) {
        parsed.registerListener({
          preValidation() {
            calls.push('child:pre');
          },
          postValidation() {
            calls.push('child:post');
          }
        });
      }
    });
    const parsed = parser.parseTree({
      event: createEvent('<parent label="Label"><child show-if="active" /></parent>')
    });
    expect(calls).toEqual([]);
    const context = { scope: { getReference: (): UnknownType | null => null } };
    expect(parsed.validate(context).map((diagnostic) => diagnostic.message)).toEqual([
      'Before',
      "'active' is not defined",
      'After'
    ]);
    expect(calls).toEqual(['parent:pre', 'child:pre', 'child:post', 'parent:post']);
    expect(
      parsed
        .validate({ scope: { ...context.scope, getReference: () => new UnknownType() } })
        .map((diagnostic) => diagnostic.message)
    ).toEqual(['Before', 'After']);
    expect(parsed.errors({ deep: true })).toEqual([]);
    expect(parsed.attribute('label').expression().value()).toBe('Label');
  });
  it('parses attributes into tree entities', () => {
    const parser = new TableParser();
    function assertParseRequiresTreeOptions() {
      // @ts-expect-error node parse requires ParseTreeOptions, not a raw XMLParseEvent
      parser.parse(createEvent('<table />'));
    }
    const parsed = parser.parseTree({ event: createEvent('<table id="orders" label="Hello" enabled="true" />') });

    expect(parsed).toBeInstanceOf(ParsedNode);
    expect(parsed.definition).toBe(parser);
    expect(parsed.attribute('id')).toBeInstanceOf(ParsedAttribute);
    expect(parsed.attribute('id').expression().value()).toBe('orders');
    expect(parsed.attribute('label')).toBeInstanceOf(ParsedAttribute);
    expect(parsed.attribute('label').expression().toString()).toBe('Hello');
    expect(parsed.attribute('enabled').expression().value()).toBe(true);
    expect(parsed.attributes(['label'])).toEqual([parsed.attribute('label')]);
    expect(parsed.attributes(['missing'])).toEqual([]);
    expect(assertParseRequiresTreeOptions).toBeTypeOf('function');
  });
  it('preserves child node arrays with common-tree children', () => {
    const parser = new TableParser();
    const parsed = parser.parseTree({
      event: createEvent('<table><column name="one" /><column name="two" /><detail code="A1" /></table>')
    });

    const columns = parsed.node('columns') as ParsedArrayNode;
    expect(columns).toBeInstanceOf(ParsedArrayNode);
    expect(columns.nodes()).toHaveLength(2);
    expect(columns.at(0).attribute('name').expression().value()).toBe('one');
    expect(columns.at(1).attribute('name').expression().value()).toBe('two');
    expect(parsed.node('detail').attribute('code').expression().value()).toBe('A1');
    expect(parsed.flatten()).toContain(columns.at(0));
  });
  it('preserves repeated alternative child nodes with the same parsed key', () => {
    const parser = new AlternativeItemsParser();
    const parsed = parser.parseTree({
      event: createEvent('<items><item label="Static" /><item query="items_query" /><item label="Another" /></items>')
    });

    const items = parsed.node('items') as ParsedArrayNode<ParsedArrayNode>;
    expect(items).toBeInstanceOf(ParsedArrayNode);
    expect(items.nodes()).toHaveLength(3);
    expect(items.nodes().every((item) => item instanceof ParsedArrayNode)).toBe(true);

    const [staticItem, queryItem, anotherStaticItem] = items.nodes().map((item) => item.at(0));
    expect([staticItem, queryItem, anotherStaticItem].map((item) => item.definition.options.name)).toEqual([
      'item',
      'item',
      'item'
    ]);
    expect(
      [staticItem, queryItem, anotherStaticItem].map((item) => item.attributes().map((attribute) => attribute.name))
    ).toEqual([['label'], ['query'], ['label']]);
    expect(staticItem.attribute('label').expression().toString()).toBe('Static');
    expect(queryItem.attribute('query').expression().toString()).toBe('items_query');
    expect(anotherStaticItem.attribute('label').expression().toString()).toBe('Another');
  });
  it('distinguishes absent functions from invalid supplied values', () => {
    const parser = new Node({ name: 'item' });
    parser.addAttribute(new FunctionAttribute({ name: 'action' }));
    for (const source of [null, '', '$:save()', 'save()', 'save', '$:true', '$:save(']) {
      const xml = source == null ? '<item />' : `<item action="${source}" />`;
      const reported: unknown[] = [];
      const parsed = parser.parseTree({
        event: createEvent(xml, {}, { pushError: ({ element }) => reported.push(element) })
      });
      const attribute = parsed.attribute('action');
      if (source === '$:save()') {
        expect(attribute.expression()).toBeInstanceOf(FunctionExpression);
        expect(attribute.expression().raw()).toBe(source);
        expect(attribute.errors()).toEqual([]);
      } else {
        expect(attribute.expression()).toBeNull();
        expect(attribute.errors()).toHaveLength(source == null ? 0 : 1);
        expect(reported).toHaveLength(source == null ? 0 : 1);
        if (source != null) {
          expect(reported[0]).toMatchObject({ name: 'action', value: source });
        }
      }
    }
  });
});
