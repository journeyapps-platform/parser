import {
  AbstractExpressionOptions,
  ListExpression,
  ListExpressionParser,
  IdentifierToken
} from '@ja-platform/parser-expressions';
import { IndexDatabase } from '@ja-platform/parser-schema';

export class SchemaDatabasesExpression extends ListExpression<IdentifierToken> {
  constructor(options: AbstractExpressionOptions) {
    super('schema-databases', options);
  }

  isValid(): boolean {
    return (
      super.isValid() &&
      this.items.every(
        (token) =>
          token instanceof IdentifierToken && Object.values(IndexDatabase).includes(token.raw() as IndexDatabase)
      )
    );
  }

  get databases(): readonly IndexDatabase[] {
    return this.items.map((token) => token.raw() as IndexDatabase);
  }
}

export class SchemaDatabasesExpressionParser extends ListExpressionParser<SchemaDatabasesExpression> {
  constructor() {
    super({
      parseItem: ({ source, start }) => new IdentifierToken(source, start),
      createExpression: (options) => new SchemaDatabasesExpression(options)
    });
  }
}
