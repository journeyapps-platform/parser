import { V5Attribute, V5AttributeGenerics, V5AttributeOptions } from '@ja-platform/parser-core';
import { IndexDatabase } from '@ja-platform/parser-schema';
import { SchemaDatabasesExpression, SchemaDatabasesExpressionParser } from '../expressions/SchemaDatabasesExpression';

interface SchemaDatabaseAttributeGenerics extends V5AttributeGenerics {
  Value: SchemaDatabasesExpression;
  Options: V5AttributeOptions<IndexDatabase[]>;
}

export class SchemaDatabaseAttribute extends V5Attribute<SchemaDatabaseAttributeGenerics> {
  constructor(options: SchemaDatabaseAttributeGenerics['Options']) {
    super('schema-databases', { ...options, syntax: new SchemaDatabasesExpressionParser() });
  }
}
