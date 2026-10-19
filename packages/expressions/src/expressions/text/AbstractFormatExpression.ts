import { ExpressionParser } from '../../ExpressionParser';
import { AbstractToken, ExpressionSource, TextToken, PlaceholderToken } from '../../tokens';
import type { ValidationContext } from '../../definitions/ValidationContext';
import { AbstractExpression, AbstractExpressionOptions, ExpressionDiagnostic } from '../AbstractExpression';

export interface AbstractFormatExpressionOptions<P extends AbstractExpression> extends AbstractExpressionOptions {
  tokens: readonly (TextToken | PlaceholderToken<P>)[];
}

/**
 * Shared format text, placeholder tokens, source positions, and rendering.
 */
export abstract class AbstractFormatExpression<
  T extends AbstractFormatExpression<T, P>,
  P extends AbstractExpression = AbstractExpression
> extends AbstractExpression<AbstractFormatExpressionOptions<P>> {
  get tokens(): readonly (TextToken | PlaceholderToken<P>)[] {
    return this.options.tokens;
  }

  isValid(): boolean {
    return this.tokens.every(
      (token) => token instanceof TextToken || (token instanceof PlaceholderToken && token.expression.isValid())
    );
  }

  get parameters(): readonly P[] {
    return this.tokens
      .filter((token): token is PlaceholderToken<P> => token instanceof PlaceholderToken)
      .map((token) => token.expression);
  }

  protected abstract getParser(): AbstractFormatExpressionParser<T, P>;

  withParameters(parameters: readonly P[]): T {
    if (parameters.length !== this.parameters.length) {
      throw new Error('Expected one expression for each format-string placeholder.');
    }
    const parser = this.getParser();
    let index = 0;
    let start = this.start;
    const tokens: (TextToken | PlaceholderToken<P>)[] = [];
    for (const token of this.tokens) {
      const replacement =
        token instanceof PlaceholderToken
          ? parser.placeholder(parameters[index++], start)
          : new TextToken(token.raw(), start);
      tokens.push(replacement);
      start = replacement.end;
    }
    return parser.parse(tokens, this.start);
  }

  /**
   * Validate each placeholder against the supplied declarations.
   */
  validate(context: ValidationContext): ExpressionDiagnostic[] {
    return this.parameters.flatMap((expression) => expression.validate(context));
  }

  /**
   * Assemble the text using resolved placeholder values in parameter order.
   * This does not parse source or evaluate parameters.
   *
   * @example
   * ```ts
   * FormatStringExpression.parse('Hello {user.name}').render(['Sam']); // 'Hello Sam'
   * ```
   */
  render(values: readonly unknown[]): string {
    let index = 0;
    return this.tokens
      .map((token) => {
        let text: string;
        if (token instanceof TextToken) {
          text = token.decodedText;
        } else {
          text = String(values[index++] ?? '');
        }
        return text;
      })
      .join('');
  }

  toString(): string {
    return this.raw();
  }
}

export abstract class AbstractFormatExpressionParser<
  T extends AbstractFormatExpression<T, P>,
  P extends AbstractExpression = AbstractExpression
> extends ExpressionParser<T> {
  protected abstract parsePlaceholder(source: ExpressionSource, start: number): P;
  protected abstract createExpression(options: AbstractFormatExpressionOptions<P>): T;

  /**
   * Reparse replacements through the concrete grammar, retaining their expression kind.
   */
  placeholder(expression: AbstractExpression, start: number): PlaceholderToken<P> {
    const parsed = this.parsePlaceholder(expression.raw(), start + 1);
    if (parsed.type !== expression.type) {
      throw new SyntaxError('Unsupported expression in a format placeholder.');
    }
    parsed.start = start;
    return new PlaceholderToken(parsed, start);
  }

  protected validateToken(token: AbstractToken): asserts token is TextToken | PlaceholderToken<P> {
    if (token instanceof TextToken) return;
    if (token instanceof PlaceholderToken) {
      this.placeholder(token.expression, token.start);
      return;
    }
    throw new SyntaxError('Expected valid format text and placeholders.');
  }

  tryParse(source: ExpressionSource, start = 0): T {
    source = source ?? '';
    let tokens: (TextToken | PlaceholderToken<P>)[];
    if (typeof source === 'string') {
      tokens = this.tokens(source, start);
    } else {
      tokens = [];
      for (const token of source) {
        this.validateToken(token);
        tokens.push(token);
      }
    }
    const expression = this.createExpression({ start, tokens });
    if (!expression.isValid()) {
      throw new SyntaxError('Expected valid format text and placeholders.');
    }
    return expression;
  }

  tokens(source: string, offset = 0): (TextToken | PlaceholderToken<P>)[] {
    const tokens: (TextToken | PlaceholderToken<P>)[] = [];
    let start = 0;
    for (let i = 0; i < source.length; i++) {
      if (source[i] !== '{') continue;
      // Doubled braces encode literal text, so they never start a placeholder.
      if (source[i + 1] === '{') {
        i++;
        continue;
      }
      const end = placeholderEnd({ source, start: i });
      // Preserve unmatched opening braces as text.
      if (end < 0) break;
      const text = source.slice(i + 1, end);
      if (text.trim() === '') throw new SyntaxError('Expected an expression inside a placeholder.');
      const expression = this.parsePlaceholder(text, offset + i + 1);
      if (!expression) throw new SyntaxError('Expected an expression inside a placeholder.');
      if (i > start) tokens.push(new TextToken(source.slice(start, i), offset + start));
      expression.start = offset + i;
      tokens.push(new PlaceholderToken(expression, offset + i));
      start = end + 1;
      i = end;
    }
    if (start < source.length) tokens.push(new TextToken(source.slice(start), offset + start));
    return tokens;
  }
}

/**
 * Balance placeholder braces independently of the embedded language. Single, double and
 * backtick quotes are opaque spans with backslash escapes; comments, regex literals and
 * nested template interpolation have no special boundary rules.
 * Return -1 for an unmatched opening brace or unfinished quoted span.
 */
function placeholderEnd({ source, start }: { source: string; start: number }): number {
  let depth = 1;
  let quote = '';
  for (let i = start + 1; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (char === '\\') i++;
      else if (char === quote) quote = '';
    } else if (char === "'" || char === '"' || char === '`') {
      quote = char;
    } else if (char === '{') {
      depth++;
    } else if (char === '}' && --depth === 0) {
      return i;
    }
  }
  return -1;
}
