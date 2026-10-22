import { Attribute, AttributeGenerics, AttributeOptions } from '@ja-platform/parser-core';
import { SchemaFieldTypeExpression, SchemaFieldTypeExpressionParser } from '../expressions/SchemaFieldTypeExpression';

interface SchemaFieldTypeAttributeGenerics extends AttributeGenerics {
  Value: SchemaFieldTypeExpression;
}

export class SchemaFieldTypeAttribute extends Attribute<SchemaFieldTypeAttributeGenerics> {
  constructor(options: AttributeOptions) {
    super('schema-field-type', { ...options, syntax: new SchemaFieldTypeExpressionParser() });
  }
}
