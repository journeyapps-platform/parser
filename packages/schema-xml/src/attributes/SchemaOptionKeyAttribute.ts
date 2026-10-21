import { AttributeParseEvent, Attribute, AttributeGenerics } from '@ja-platform/parser-core';
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
    const field = event.parentNode?.attrExpression('type') as SchemaFieldTypeExpression | undefined;
    const type: Type<SchemaOptionKey> =
      field?.primitive === PrimitiveType.BOOLEAN
        ? booleanType
        : field?.primitive === PrimitiveType.SINGLE_CHOICE_INTEGER ||
            field?.primitive === PrimitiveType.MULTIPLE_CHOICE_INTEGER
          ? integerType
          : textType;
    return new ConstantExpressionParser(type).parse(event.input.value);
  }
}
