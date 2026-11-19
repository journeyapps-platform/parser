import { parseExpression, JSToken, TextToken, FormatShorthandExpression, ShorthandExpression } from '../src';
import { describe, expect, it } from 'vitest';

describe('FormatShorthandExpression', () => {
  it('preserves a format specifier through serialization and cloning', () => {
    const token = FormatShorthandExpression.parse('price' + ':' + '.2f');
    expect(token).toBeInstanceOf(ShorthandExpression);
    expect(token.raw()).toBe('price:.2f');
    const clone = token.clone();
    expect(clone).toBeInstanceOf(FormatShorthandExpression);
    expect(clone.raw()).toBe('price:.2f');
  });

  it.each(['value:05', 'value:.2f', 'product.price:.2f'])('recognizes format specifiers: %s', (source) => {
    const expression = parseExpression(source);
    expect(expression).toBeInstanceOf(FormatShorthandExpression);
    expect(expression.raw()).toBe(source);
    expect(expression.format).toBe(source.includes('05') ? '05' : '.2f');
  });

  it('validates and preserves supplied reference and format tokens', () => {
    const tokens = [new JSToken('user.name'), new TextToken(':.2f')];
    const expression = FormatShorthandExpression.parse(tokens);
    expect(expression.tokens[0]).toBe(tokens[0]);
    expect(expression.tokens[1]).toBe(tokens[1]);
    expect(expression.format).toBe('.2f');
    expect(expression.isValid()).toBe(true);
    expect(() => FormatShorthandExpression.parse('price:')).toThrow(SyntaxError);
    expect(new FormatShorthandExpression({ format: '', tokens: [new JSToken('save()')] }).isValid()).toBe(false);
  });
});
