import { Attribute, AttributeGenerics, AttributeParseEvent } from '@ja-platform/parser-core';
import { ConstantExpression, ConstantExpressionParser } from '@ja-platform/parser-expressions';
import { booleanType, integerType, textType, Type } from '@ja-platform/parser-type-system';
import { PrimitiveType } from '@ja-platform/parser-schema';
import { SchemaFieldTypeExpression } from '../expressions/SchemaFieldTypeExpression';

export type SchemaOptionKey = string | number | boolean;

interface SchemaOptionKeyGenerics extends AttributeGenerics {
  Value: ConstantExpression<SchemaOptionKey>;
  NormalizedValue: SchemaOptionKey;
}

/**
 * Choice keys use the enclosing field's declared literal type.
 */
export class SchemaOptionKeyAttribute extends Attribute<SchemaOptionKeyGenerics> {
  constructor() {
    super('schema-option-key', { name: 'key' });
  }

  protected getParsedValue(event: AttributeParseEvent): ConstantExpression<SchemaOptionKey> {
    const field = event.context?.parentNode?.attrExpression('type') as SchemaFieldTypeExpression | undefined;
    return new ConstantExpressionParser(this.keyType(field?.primitive)).parse(event.input.value);
  }

  private keyType(primitive?: SchemaFieldTypeExpression['primitive']): Type<SchemaOptionKey> {
    if (primitive === PrimitiveType.BOOLEAN) return booleanType;
    if (primitive === PrimitiveType.SINGLE_CHOICE_INTEGER || primitive === PrimitiveType.MULTIPLE_CHOICE_INTEGER) {
      return integerType;
    }
    return textType;
  }
}
