import { ConstantExpression, ConstantExpressionParser } from '@ja-platform/parser-expressions';
import { booleanType } from '@ja-platform/parser-type-system';
import { Attribute, AttributeGenerics, AttributeOptions } from './Attribute';

export interface ConstantBooleanAttributeGenerics extends AttributeGenerics {
  Options: AttributeOptions<boolean, boolean>;
  Value: ConstantExpression<boolean> | null;
  NormalizedValue: boolean;
}

/**
 * A boolean attribute that accepts constant text only.
 */
export class ConstantBooleanAttribute extends Attribute<ConstantBooleanAttributeGenerics> {
  static TYPE = 'constant-boolean-attribute';

  static isInstanceOf(attr: Attribute): attr is ConstantBooleanAttribute {
    return attr.type === ConstantBooleanAttribute.TYPE;
  }

  constructor(options: ConstantBooleanAttributeGenerics['Options']) {
    const valueType = options.valueType ?? booleanType;
    super(ConstantBooleanAttribute.TYPE, {
      ...options,
      syntax: new ConstantExpressionParser(valueType),
      valueType
    });
  }
}
