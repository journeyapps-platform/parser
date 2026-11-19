import { Attribute, AttributeGenerics, AttributeOptions } from '@ja-platform/parser-core';
import { SchemaIndexExpression, SchemaIndexExpressionParser } from '../expressions/SchemaIndexExpression';

interface SchemaIndexAttributeGenerics extends AttributeGenerics {
  Value: SchemaIndexExpression;
}

export class SchemaIndexAttribute extends Attribute<SchemaIndexAttributeGenerics> {
  constructor(options: AttributeOptions) {
    super('schema-index', { ...options, syntax: new SchemaIndexExpressionParser() });
  }
}
