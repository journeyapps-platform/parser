import { SchemaObjectDisplayExpression } from '../src';
import { FunctionExpression, ShorthandExpression } from '@ja-platform/parser-expressions';
import { describe, it, expect, expectTypeOf } from 'vitest';

describe('schema object display', () => {
  it('retains typed shorthand parameters and renders supplied values', () => {
    const expression = SchemaObjectDisplayExpression.parse('Price: {price:.2f}');
    expectTypeOf(expression.parameters).toEqualTypeOf<readonly ShorthandExpression[]>();
    expect(expression.parameters[0].format).toBe('.2f');
    expect(expression.render(['12.50'])).toBe('Price: 12.50');
  });

  it('rejects evaluated and constant placeholders in schema displays and replacements', () => {
    for (const display of ['{$:Math.floor(thing)}', '{42}']) {
      expect(() => SchemaObjectDisplayExpression.parse(display)).toThrow(SyntaxError);
    }
    const expression = SchemaObjectDisplayExpression.parse('{name}');
    // @ts-expect-error Exercise runtime rejection of a placeholder outside the schema grammar.
    expect(() => expression.withParameters([FunctionExpression.parse('$:load()')])).toThrow(SyntaxError);
  });
});
