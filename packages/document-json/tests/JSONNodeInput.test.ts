import { textType, numberType } from '@ja-platform/parser-type-system';
import { AttributeInputKind } from '@ja-platform/parser-core';
import { describe, expect, it, vi } from 'vitest';
import { Node, ContentNode, NodeAlternatives, RecordNode, EitherNode } from '@ja-platform/parser-core';
import {
  NumberAttribute,
  ParsedValue,
  ConstantExpressionValueProvider,
  ParserDefaultValueProvider
} from '@ja-platform/parser-core';
import { JSONNodeInput, JSONSourceReference } from '../src';

describe('JSON document input', () => {
  it('selects either branches by shape without parsing the other branches', () => {
    const text = new ContentNode({ name: 'value', valueType: textType });
    const numbers = new ContentNode({ name: 'value', valueType: numberType, isMultiple: true });
    const object = new Node({ name: 'value' });
    object.addAttribute(new NumberAttribute({ name: 'count' }));
    const either = new EitherNode({ name: 'value', alternatives: [text, numbers, object] });
    const parseText = vi.spyOn(text, 'parse');
    for (const expected of ['hello', [], [1, 2], { count: 3 }]) {
      const parsed = either.parseTree({ input: JSONNodeInput.parse(JSON.stringify(expected)), report: () => {} });
      parsed.setValueProviders([new ConstantExpressionValueProvider()]);
      const values = parsed.valueTree();
      expect(values.current).toEqual(expected);
      expect(parsed.errors({ deep: true })).toEqual([]);
      values.dispose();
    }
    expect(parseText).toHaveBeenCalledTimes(1);
    const source = '[1,"bad"]';
    const invalid = either.parseTree({ input: JSONNodeInput.parse(source), report: () => {} });
    const [error] = invalid.errors({ deep: true });
    expect(source.slice(error.source.range.start, error.source.range.end)).toBe('"bad"');
    expect(parseText).toHaveBeenCalledTimes(1);
    const noMatch = either.parseTree({ input: JSONNodeInput.parse('true'), report: () => {} });
    expect(noMatch.errors()[0].message).toContain('No alternative');
  });

  it('reports ambiguous either branches without executing either parser', () => {
    const first = new ContentNode({ name: 'value', valueType: textType });
    const second = new ContentNode({ name: 'value', valueType: textType });
    const parse = vi.spyOn(first, 'parse');
    const definition = new EitherNode({ name: 'value', alternatives: [first, second] });
    const parsed = definition.parseTree({ input: JSONNodeInput.parse('"hello"'), report: () => {} });
    expect(parsed.errors()[0].message).toContain('Multiple alternatives');
    expect(parse).not.toHaveBeenCalled();
  });

  it('parses named records with entry-level diagnostics', () => {
    const entry = new ContentNode({ name: 'entry', valueType: numberType, defaultValue: 10 });
    const definition = new RecordNode({ name: 'sizes', entry });
    const parsed = definition.parseTree({
      input: JSONNodeInput.parse('{"small":2,"large":4}'),
      report: () => {}
    });
    parsed.setValueProviders([new ParserDefaultValueProvider(), new ConstantExpressionValueProvider()]);
    const recordValues = parsed.valueTree();
    expect(recordValues.current).toEqual({ small: 2, large: 4 });
    expect(parsed.nodes().every((node) => node.getParent() === parsed)).toBe(true);
    recordValues.dispose();
    const empty = definition.parseTree({ input: JSONNodeInput.parse('{}'), report: () => {} });
    empty.setValueProviders([new ParserDefaultValueProvider(), new ConstantExpressionValueProvider()]);
    const values = empty.valueTree();
    expect(values.current).toEqual({});
    values.dispose();

    const source = '{"small":"invalid"}';
    const invalid = definition.parseTree({ input: JSONNodeInput.parse(source), report: () => {} });
    const [error] = invalid.errors({ deep: true });
    expect(source.slice(error.source.range.start, error.source.range.end)).toBe('"invalid"');
    const duplicate = definition.parseTree({
      input: JSONNodeInput.parse('{"small":1,"small":2}'),
      report: () => {}
    });
    expect(duplicate.errors({ deep: true })[0].message).toBe("Duplicate record key 'small'");
    for (const source of ['[]', 'null', '2', '"text"']) {
      expect(definition.parseTree({ input: JSONNodeInput.parse(source), report: () => {} }).errors()).toHaveLength(1);
    }
  });

  it('parses a tree with repeated alternatives, native content and parsed parent access', () => {
    const definition = new Node({ name: 'view' });
    const item = new Node({ name: 'item', key: 'items', isMultiple: true });
    const count = new NumberAttribute({ name: 'count' });
    item.addAttribute(count);
    const parseAttribute = vi.spyOn(count, 'parse');
    const total = new ContentNode({ name: 'total', valueType: count.options.valueType });
    definition.addNode(new NodeAlternatives({ key: 'entries', alternatives: [item, total] }));
    const input = JSONNodeInput.parse(
      JSON.stringify({
        items: [{ count: 2 }, { count: 4 }],
        total: 3
      })
    );
    const report = vi.fn();
    const parsed = definition.parseTree({ input, report });
    expect(parsed.nodes().map((node) => node.input.name)).toEqual(['item', 'item', 'total']);
    expect(parsed.nodes()[0].attrExpression('count').value()).toBe(2);
    expect(parsed.nodes()[2].content().value()).toBe(3);
    expect(parsed.nodes()[1].attrExpression('count').value()).toBe(4);
    for (const [, context] of parseAttribute.mock.calls) expect(context.parentNode).toBe(parsed);
    expect(report).not.toHaveBeenCalled();
  });

  it('locates attribute errors and missing-child diagnostics in the JSON document', () => {
    const definition = new Node({ name: 'view' });
    definition.addAttribute(new NumberAttribute({ name: 'count' }));
    definition.addNode(new Node({ name: 'required', isRequired: true }));
    const text = '{"count":"invalid"}';
    const input = JSONNodeInput.parse(text);
    const report = vi.fn();
    const parsed = definition.parseTree({ input, report });
    const [diagnostic] = parsed.errors({ deep: true });
    expect(diagnostic.source).toBeInstanceOf(JSONSourceReference);
    expect(text.slice(diagnostic.source.range.start, diagnostic.source.range.end)).toBe('"invalid"');
    expect(report).toHaveBeenCalledWith(diagnostic);
    const validation = parsed.validate({ scope: { getReference: () => undefined } });
    expect(validation).toHaveLength(1);
    expect(validation[0].source).toBe(input.source);
  });

  it('preserves native values, absent inputs, nested nodes and source ranges', () => {
    const text = '{"size":0,"empty":null,"button":{}}';
    const input = JSONNodeInput.parse(text, 'view');
    expect(input.name).toBe('view');
    expect(input.attribute('missing')).toBeUndefined();
    expect(input.attribute('empty')).toMatchObject({ kind: AttributeInputKind.LITERAL, value: null });
    expect([...input.children()].map((child) => child.name)).toEqual(['size', 'empty', 'button']);
    const size = input.attribute('size');
    expect(size.source).toBeInstanceOf(JSONSourceReference);
    expect(text.slice(size.source.range.start, size.source.range.end)).toBe('0');
    const attribute = new NumberAttribute({ name: 'size' }).parseInput(size);
    const provider = new ConstantExpressionValueProvider();
    const value = new ParsedValue(attribute, [provider]);
    expect(value.current).toBe(0);
    value.dispose();
    provider.dispose();
  });

  it('allows incomplete document structure without constructor validation', () => {
    const input = JSONNodeInput.parse('{"child":{}}');
    expect(input.name).toBe('');
    expect([...input.children()][0].name).toBe('child');
    const matrix = JSONNodeInput.parse('{"matrix":[[1,2],[]]}');
    expect(matrix.attribute('matrix').value).toEqual([[1, 2], []]);
    expect([...matrix.children()][0].content().value).toEqual([[1, 2], []]);
  });

  it('parses properties as attributes, content and collections', () => {
    const definition = new Node({ name: 'config' });
    definition.addAttribute(new NumberAttribute({ name: 'delay' }));
    definition.addNode(new ContentNode({ name: 'title', valueType: textType }));
    definition.addNode(
      new ContentNode({
        name: 'language',
        key: 'languages',
        isMultiple: true,
        valueType: textType,
        defaultValue: ['en']
      })
    );
    const report = vi.fn();
    const input = JSONNodeInput.parse('{"delay":500,"title":"App","languages":["en","fr"]}');
    const result = definition.parseTree({ input, report });
    result.setValueProviders([new ParserDefaultValueProvider(), new ConstantExpressionValueProvider()]);
    const values = result.valueTree();
    expect(values.current).toEqual({ delay: 500, title: 'App', languages: ['en', 'fr'] });
    expect(report).not.toHaveBeenCalled();
    values.dispose();
    for (const [source, expected] of [
      ['{}', ['en']],
      ['{"languages":[]}', []]
    ] as const) {
      const parsed = definition.parseTree({ input: JSONNodeInput.parse(source), report: vi.fn() });
      parsed.setValueProviders([new ParserDefaultValueProvider(), new ConstantExpressionValueProvider()]);
      const value = parsed.valueTree();
      expect(value.current.languages).toEqual(expected);
      value.dispose();
    }
    const source = '{"languages":"en"}';
    const parsed = definition.parseTree({ input: JSONNodeInput.parse(source), report: vi.fn() });
    const [diagnostic] = parsed.errors();
    expect(diagnostic.message).toBe("Expected an array for 'languages'");
    expect(source.slice(diagnostic.source.range.start, diagnostic.source.range.end)).toBe('"en"');
  });

  it('reports a JSON property claimed as both an attribute and a child', () => {
    const definition = new Node({ name: 'config' });
    definition.addAttribute(new NumberAttribute({ name: 'count' }));
    definition.addNode(new ContentNode({ name: 'count', valueType: textType }));
    const parsed = definition.parseTree({ input: JSONNodeInput.parse('{"count":2}'), report: vi.fn() });
    expect(parsed.errors()).toMatchObject([
      { message: "Property 'count' is defined as both an attribute and a child" }
    ]);
  });

  it.each(['{"count":', '{"count":1,}'])('rejects invalid JSON syntax: %s', (text) => {
    expect(() => JSONNodeInput.parse(text)).toThrow(SyntaxError);
  });
});
