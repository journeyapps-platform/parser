import { ConstantExpression, ConstantExpressionParser } from '@ja-platform/parser-expressions';
import { booleanType } from '@ja-platform/parser-type-system';
import { V5Attribute, V5AttributeGenerics, V5AttributeOptions } from './V5Attribute';

export interface V5ConstantBooleanAttributeGenerics extends V5AttributeGenerics {
  Options: V5AttributeOptions<boolean, boolean>;
  Value: ConstantExpression<boolean> | null;
  NormalizedValue: boolean;
}

/**
 * A boolean attribute that accepts constant text only.
 */
export class V5ConstantBooleanAttribute extends V5Attribute<V5ConstantBooleanAttributeGenerics> {
  static TYPE = 'constant-boolean-attribute';

  static isInstanceOf(attr: V5Attribute): attr is V5ConstantBooleanAttribute {
    return attr.type === V5ConstantBooleanAttribute.TYPE;
  }

  constructor(options: V5ConstantBooleanAttributeGenerics['Options']) {
    const valueType = options.valueType ?? booleanType;
    super(V5ConstantBooleanAttribute.TYPE, {
      ...options,
      syntax: new ConstantExpressionParser(valueType),
      valueType
    });
  }
}
