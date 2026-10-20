import { ExpressionParser } from '../ExpressionParser';
import { AbstractToken, DelimiterToken, ExpressionSource } from '../tokens';
import { AbstractExpression, AbstractExpressionOptions } from './AbstractExpression';

/**
 * A comma-separated list retaining item tokens, separators and whitespace.
 */
export abstract class ListExpression<T extends AbstractToken> extends AbstractExpression {
  protected isDelimiter(token: AbstractToken): token is DelimiterToken {
    return token instanceof DelimiterToken;
  }

  get items(): readonly T[] {
    return this.tokens.filter((token) => !this.isDelimiter(token)) as T[];
  }

  isValid(): boolean {
    const tokens = this.tokens.filter((token) => !(this.isDelimiter(token) && /^\s+$/.test(token.raw())));
    return (
      tokens.length % 2 === 1 &&
      tokens.every((token, index) =>
        index % 2 === 1 ? this.isDelimiter(token) && /^\s*,\s*$/.test(token.raw()) : !this.isDelimiter(token)
      )
    );
  }
}

export interface ListExpressionParserOptions<E extends ListExpression<AbstractToken>> {
  parseItem: (input: { source: string; start: number }) => AbstractToken;
  createExpression: (options: AbstractExpressionOptions) => E;
}

/**
 * Parses list structure while delegating item syntax to the owning expression.
 */
export class ListExpressionParser<E extends ListExpression<AbstractToken>> extends ExpressionParser<E> {
  constructor(readonly options: ListExpressionParserOptions<E>) {
    super();
  }

  tryParse(source: ExpressionSource, start = 0): E {
    const tokens =
      typeof source === 'string'
        ? Array.from(source.matchAll(/[,\s]+|[^,\s]+/g), (match) => {
            const position = start + match.index;
            return /^[,\s]/.test(match[0])
              ? new DelimiterToken(match[0], position)
              : this.options.parseItem({ source: match[0], start: position });
          })
        : source;
    return this.options.createExpression({ tokens });
  }
}
