import { describe, expect, it } from 'vitest';
import {
  AbstractExpressionOptions,
  DelimiterToken,
  IdentifierToken,
  ListExpression,
  ListExpressionParser
} from '../src';

class IdentifierList extends ListExpression<IdentifierToken> {
  constructor(options: AbstractExpressionOptions) {
    super('identifier-list', options);
  }

  isValid(): boolean {
    return super.isValid() && this.items.every((token) => token instanceof IdentifierToken && token.isValid());
  }
}

const parser = new ListExpressionParser({
  parseItem: ({ source, start }) => new IdentifierToken(source, start),
  createExpression: (options) => new IdentifierList(options)
});

describe('ListExpression', () => {
  it('preserves item positions and separators when parsing source or existing tokens', () => {
    const expression = parser.parse(' first, second ', 10);
    expect(expression.items.map((token) => [token.raw(), token.start, token.end])).toEqual([
      ['first', 11, 16],
      ['second', 18, 24]
    ]);
    expect(expression.tokens.filter((token) => token instanceof DelimiterToken).map((token) => token.raw())).toEqual([
      ' ',
      ', ',
      ' '
    ]);
    expect(expression.raw()).toBe(' first, second ');
    expect(parser.parse(expression.tokens).items).toEqual(expression.items);
  });

  it.each(['', ' ', ',first', 'first,', 'first,,second', 'first second', 'first, 123'])(
    'rejects malformed lists: %j',
    (source) => {
      expect(() => parser.parse(source)).toThrow(SyntaxError);
    }
  );

  it('validates pre-tokenized items and separators', () => {
    const malformed = parser.tryParse('first, 123');
    expect(malformed.items.map((token) => token.raw())).toEqual(['first', '123']);
    expect(malformed.isValid()).toBe(false);
    expect(() =>
      parser.parse([new IdentifierToken('first'), new DelimiterToken(';', 5), new IdentifierToken('second', 6)])
    ).toThrow(SyntaxError);
  });
});
