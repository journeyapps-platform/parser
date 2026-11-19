import { AttributeInputKind } from '../src';
import { describe, expect, it, vi } from 'vitest';
import {
  Attribute,
  BooleanAttribute,
  ConstantExpressionValueProvider,
  NumberAttribute,
  ParsedValue,
  ParserDefaultValueProvider,
  TextAttribute
} from '../src';

describe('Source-independent attributes', () => {
  it('resolves defaults without an XML element or authored expression', () => {
    const definition = new NumberAttribute({ name: 'size', defaultValue: 0 });
    const attribute = definition.parseInput();
    expect(attribute.expression()).toBeNull();
    expect(attribute.input).toBeUndefined();
    const provider = new ParserDefaultValueProvider();
    const value = new ParsedValue(attribute, [provider]);
    expect(value.current).toBe(0);
    value.dispose();
    provider.dispose();
  });

  it('preserves source references and text expression parsing', () => {
    const source = { range: { start: 10, end: 15 }, custom: 'json' };
    const attribute = new TextAttribute({ name: 'label' }).parseInput({
      kind: AttributeInputKind.TEXT,
      value: 'Hello',
      source
    });
    expect(attribute.input?.source).toBe(source);
    expect(attribute.expression().raw()).toBe('Hello');
  });

  it.each([
    [new NumberAttribute({ name: 'value' }), 0],
    [new BooleanAttribute({ name: 'value' }), false]
  ])('resolves native literals without string coercion', (definition, input) => {
    const attribute = (definition as Attribute).parseInput({ kind: AttributeInputKind.LITERAL, value: input });
    const provider = new ConstantExpressionValueProvider();
    const value = new ParsedValue(attribute, [provider]);
    expect(value.current).toBe(input);
    value.dispose();
    provider.dispose();
  });

  it('reports syntax errors against the supplied source', () => {
    const source = { range: { start: 0, end: 3 } };
    const report = vi.fn();
    const attribute = new NumberAttribute({ name: 'size' }).parseInput(
      { kind: AttributeInputKind.TEXT, value: 'bad', source },
      { report }
    );
    expect(attribute.hasErrors()).toBe(true);
    expect(attribute.errors()[0].source).toBe(source);
    expect(report).toHaveBeenCalledWith({ message: expect.any(String), source });
  });
});
