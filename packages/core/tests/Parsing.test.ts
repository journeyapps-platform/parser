import { describe, expect, it, vi } from 'vitest';
import { parse } from '@journeyapps/common-xml';
import { numberType, textType } from '@ja-platform/parser-type-system';
import { ConstantExpression, ConstantExpressionParser } from '@ja-platform/parser-expressions';
import {
  ConstantExpressionValueProvider,
  ParsedArrayNode,
  ParsedValue,
  ParserDefaultValueProvider,
  Attribute,
  Node,
  BooleanAttribute,
  ConstantTextAttribute,
  ContentNode,
  ExpressionAttribute,
  NodeAlternatives,
  NumberAttribute,
  TextAttribute,
  SetAttribute,
  TextArrayAttribute
} from '../src';

const scope = { getReference: () => null };

function parseDocument(definition: Node, source: string) {
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
    const definition = new Node({ name: 'settings' });
    definition.addAttribute(new Attribute(Attribute.TYPE, { name: 'value', defaultValue }));
    const node = parseDocument(definition, '<settings />');
    const provider = new ParserDefaultValueProvider();
    const value = new ParsedValue(node.attribute('value'), [provider]);
    expect(value.current).toBe(defaultValue);
    expect(value.providerValues[0].active).toBe(defaultValue !== undefined);
    value.dispose();
    provider.dispose();
  });

  it.each([
    { attribute: new NumberAttribute({ name: 'value', defaultValue: 0 }), expected: 0 },
    { attribute: new NumberAttribute({ name: 'value', defaultValue: 42 }), expected: 42 },
    { attribute: new BooleanAttribute({ name: 'value', defaultValue: false }), expected: false },
    { attribute: new BooleanAttribute({ name: 'value', defaultValue: true }), expected: true },
    { attribute: new TextAttribute({ name: 'value', defaultValue: '' }), expected: '' },
    { attribute: new TextAttribute({ name: 'value', defaultValue: 'hello' }), expected: 'hello' },
    { attribute: new SetAttribute({ name: 'value', options: ['', 'one'], defaultValue: '' }), expected: '' },
    {
      attribute: new SetAttribute({ name: 'value', options: ['one'], defaultValue: 'one' }),
      expected: 'one'
    },
    { attribute: new TextArrayAttribute({ name: 'value', defaultValue: [] }), expected: [] },
    {
      attribute: new TextArrayAttribute({ name: 'value', defaultValue: ['one', 'two'] }),
      expected: ['one', 'two']
    }
  ])('resolves typed attribute defaults as literal values: $attribute.type / $expected', ({ attribute, expected }) => {
    const definition = new Node({ name: 'settings' });
    definition.addAttribute(attribute);
    const node = parseDocument(definition, '<settings />');
    const provider = new ParserDefaultValueProvider();
    node.setValueProviders([provider]);
    const value = node.valueTree();
    expect(value.current).toEqual({ value: expected });
    expect(attribute.serialize().defaultValue).toEqual(expected);
    value.dispose();
    provider.dispose();
  });

  it('composes attributed child nodes and runs their parsing listeners', () => {
    const definition = new Node({ name: 'settings' });
    const child = new Node({ name: 'item', key: 'items', isMultiple: true });
    child.addAttribute(new ConstantTextAttribute({ name: 'label' }));
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
    const definition = new Node({ name: 'settings' });
    definition.addAttributes([
      new NumberAttribute({ name: 'count', range: { min: 1, max: 10 } }),
      new BooleanAttribute({ name: 'enabled' })
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
    const definition = new Node({ name: 'settings' });
    definition.addNode(
      new ContentNode({
        name: 'count',
        key: 'counts',
        isMultiple: true,
        isRequired: true,
        valueType: numberType
      })
    );
    definition.addNode(
      new NodeAlternatives({
        key: 'label',
        exclusive: true,
        alternatives: [
          new ContentNode({ name: 'title', valueType: textType }),
          new ContentNode({ name: 'caption', valueType: textType })
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

  it('supports expression validation through consumer-supplied interfaces', () => {
    const definition = new Node({ name: 'settings' });
    definition.addAttributes([
      new ExpressionAttribute({ name: 'source' }),
      new ConstantTextAttribute({ name: 'label' }),
      new TextAttribute({ name: 'description', syntax: new ConstantExpressionParser(textType) })
    ]);
    const node = parseDocument(definition, '<settings source="missing" label="Title" description="Details" />');
    expect(node.attribute('label').expression()).toBeInstanceOf(ConstantExpression);
    expect(node.validate({ scope })).toEqual([
      expect.objectContaining({ message: expect.stringContaining('missing') })
    ]);
  });
});
