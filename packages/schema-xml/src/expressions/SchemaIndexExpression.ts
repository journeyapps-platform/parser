import { AbstractExpressionOptions, ListExpression, ListExpressionParser } from '@ja-platform/parser-expressions';
import { ModelIndexKey } from '@ja-platform/parser-schema';
import { SchemaIndexKeyToken } from '../tokens/SchemaIndexKeyToken';

/**
 * Index field references and their sort directions, derived from the source tokens.
 */
export class SchemaIndexExpression extends ListExpression<SchemaIndexKeyToken> {
  constructor(options: AbstractExpressionOptions) {
    super('schema-index', options);
  }

  isValid(): boolean {
    return super.isValid() && this.items.every((token) => token instanceof SchemaIndexKeyToken && token.isValid());
  }

  get keys(): readonly ModelIndexKey[] {
    return this.items.map((token) => ({ field: token.field, dir: token.direction }));
  }
}

export class SchemaIndexExpressionParser extends ListExpressionParser<SchemaIndexExpression> {
  constructor() {
    super({
      parseItem: ({ source, start }) => new SchemaIndexKeyToken(source, start),
      createExpression: (options) => new SchemaIndexExpression(options)
    });
  }
}
