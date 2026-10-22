import { AttributeInputKind } from '@ja-platform/parser-core';
import { describe, expect, it, vi } from 'vitest';
import { Node, ContentNode, NodeAlternatives } from '@ja-platform/parser-core';
import { NumberAttribute, ParsedValue, ConstantExpressionValueProvider } from '@ja-platform/parser-core';
import { JSONNodeInput, JSONSourceReference } from '../src';

describe('JSON document input', () => {
  it('parses a tree with repeated alternatives, native content and parsed parent access', () => {
    const definition = new Node({ name: 'view' });
    const item = new Node({ name: 'item', isMultiple: true });
    const count = new NumberAttribute({ name: 'count' });
    item.addAttribute(count);
    const parseAttribute = vi.spyOn(count, 'parse');
    const total = new ContentNode({ name: 'total', valueType: count.options.valueType });
    definition.addNode(new NodeAlternatives({ key: 'entries', alternatives: [item, total] }));
    const input = JSONNodeInput.parse(
      JSON.stringify({
        type: 'view',
        children: [
          { type: 'item', attributes: { count: 2 } },
          { type: 'total', content: 3 },
          { type: 'item', attributes: { count: 4 } }
        ]
      })
    );
    const report = vi.fn();
    const parsed = definition.parseTree({ input, report });
    expect(parsed.nodes().map((node) => node.input.name)).toEqual(['item', 'total', 'item']);
    expect(parsed.nodes()[0].attrExpression('count').value()).toBe(2);
    expect(parsed.nodes()[1].content().value()).toBe(3);
    expect(parsed.nodes()[2].attrExpression('count').value()).toBe(4);
    for (const [, context] of parseAttribute.mock.calls) expect(context.parentNode).toBe(parsed);
    expect(report).not.toHaveBeenCalled();
  });

  it('locates attribute errors and missing-child diagnostics in the JSON document', () => {
    const definition = new Node({ name: 'view' });
    definition.addAttribute(new NumberAttribute({ name: 'count' }));
    definition.addNode(new Node({ name: 'required', isRequired: true }));
    const text = '{"type":"view","attributes":{"count":"invalid"}}';
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
    const text = '{"type":"view","attributes":{"size":0,"empty":null},"children":[{"type":"button"}]}';
    const input = JSONNodeInput.parse(text);
    expect(input.name).toBe('view');
    expect(input.attribute('missing')).toBeUndefined();
    expect(input.attribute('empty')).toMatchObject({ kind: AttributeInputKind.LITERAL, value: null });
    expect([...input.children()].map((child) => child.name)).toEqual(['button']);
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
    const input = JSONNodeInput.parse('{"children":[{}]}');
    expect(input.name).toBe('');
    expect([...input.children()][0].name).toBe('');
  });

  it.each(['{"type":', '{"type":"view",}'])('rejects invalid JSON syntax: %s', (text) => {
    expect(() => JSONNodeInput.parse(text)).toThrow(SyntaxError);
  });
});
