import { V5Attribute, V5AttributeGenerics, V5AttributeOptions } from '@ja-platform/parser-core';
import { SchemaFieldTypeExpression, SchemaFieldTypeExpressionParser } from '../expressions/SchemaFieldTypeExpression';

interface SchemaFieldTypeAttributeGenerics extends V5AttributeGenerics {
  Value: SchemaFieldTypeExpression;
}

export class SchemaFieldTypeAttribute extends V5Attribute<SchemaFieldTypeAttributeGenerics> {
  constructor(options: V5AttributeOptions) {
    super('schema-field-type', { ...options, syntax: new SchemaFieldTypeExpressionParser() });
  }
}
