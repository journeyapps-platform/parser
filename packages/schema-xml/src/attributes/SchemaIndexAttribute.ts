import { V5Attribute, V5AttributeGenerics, V5AttributeOptions } from '@ja-platform/parser-core';
import { SchemaIndexExpression, SchemaIndexExpressionParser } from '../expressions/SchemaIndexExpression';

interface SchemaIndexAttributeGenerics extends V5AttributeGenerics {
  Value: SchemaIndexExpression;
}

export class SchemaIndexAttribute extends V5Attribute<SchemaIndexAttributeGenerics> {
  constructor(options: V5AttributeOptions) {
    super('schema-index', { ...options, syntax: new SchemaIndexExpressionParser() });
  }
}
