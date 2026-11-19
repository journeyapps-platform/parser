import {
  AbstractExpression,
  AbstractExpressionOptions,
  ExpressionParser,
  ExpressionSource,
  PrefixToken,
  TextToken
} from '@ja-platform/parser-expressions';
import { PrimitiveTypeMap } from '@ja-platform/parser-schema';
import { TEXT_SUBTYPES } from '@ja-platform/parser-schema';

/**
 * A primitive declaration, with an optional prefix introducing its subtype.
 */
export class SchemaFieldTypeExpression extends AbstractExpression {
  constructor(options: AbstractExpressionOptions) {
    super('schema-field-type', options);
  }

  get primitive(): keyof typeof PrimitiveTypeMap {
    const first = this.tokens[0];
    return (first instanceof PrefixToken ? first.raw().slice(0, -1) : first?.raw()) as keyof typeof PrimitiveTypeMap;
  }

  get subtype(): string | undefined {
    return this.tokens[0] instanceof PrefixToken ? this.tokens[1]?.raw() : undefined;
  }

  isValid(): boolean {
    const [first, second] = this.tokens;
    if (first instanceof PrefixToken) {
      return (
        this.tokens.length === 2 &&
        first.isValid() &&
        first.raw() === 'text:' &&
        second instanceof TextToken &&
        TEXT_SUBTYPES.includes(second.raw())
      );
    }
    return this.tokens.length === 1 && first instanceof TextToken && Object.hasOwn(PrimitiveTypeMap, first.raw());
  }
}

export class SchemaFieldTypeExpressionParser extends ExpressionParser<SchemaFieldTypeExpression> {
  tryParse(source: ExpressionSource, start = 0): SchemaFieldTypeExpression {
    if (typeof source !== 'string') return new SchemaFieldTypeExpression({ tokens: source });
    const colon = source.indexOf(':');
    const tokens =
      colon === -1
        ? [new TextToken(source, start)]
        : [
            new PrefixToken(start, source.slice(0, colon + 1)),
            new TextToken(source.slice(colon + 1), start + colon + 1)
          ];
    return new SchemaFieldTypeExpression({ tokens });
  }
}
