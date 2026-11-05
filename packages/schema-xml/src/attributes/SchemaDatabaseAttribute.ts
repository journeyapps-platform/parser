import { Attribute, AttributeGenerics, AttributeOptions } from '@ja-platform/parser-core';
import { IndexDatabase } from '@ja-platform/parser-schema';
import { SchemaDatabasesExpression, SchemaDatabasesExpressionParser } from '../expressions/SchemaDatabasesExpression';

interface SchemaDatabaseAttributeGenerics extends AttributeGenerics {
  Value: SchemaDatabasesExpression;
  Options: AttributeOptions<IndexDatabase[]>;
}

export class SchemaDatabaseAttribute extends Attribute<SchemaDatabaseAttributeGenerics> {
  constructor(options: SchemaDatabaseAttributeGenerics['Options']) {
    super('schema-databases', { ...options, syntax: new SchemaDatabasesExpressionParser() });
  }
}
