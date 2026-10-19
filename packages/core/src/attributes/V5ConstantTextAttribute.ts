import { ConstantExpression, ConstantExpressionParser } from '@ja-platform/parser-expressions';
import { textType } from '@ja-platform/parser-type-system';
import { V5Attribute, V5AttributeGenerics, V5AttributeOptions } from './V5Attribute';

export interface V5ConstantTextAttributeGenerics extends V5AttributeGenerics {
  Options: V5AttributeOptions<string, string>;
  Value: ConstantExpression | null;
  NormalizedValue: string;
}

/**
 * A string attribute that accepts constant text only.
 */
export class V5ConstantTextAttribute extends V5Attribute<V5ConstantTextAttributeGenerics> {
  static TYPE = 'constant-text-attribute';

  static isInstanceOf(attr: V5Attribute): attr is V5ConstantTextAttribute {
    return attr.type === V5ConstantTextAttribute.TYPE;
  }

  constructor(options: V5ConstantTextAttributeGenerics['Options']) {
    const valueType = options.valueType ?? textType;
    super(V5ConstantTextAttribute.TYPE, {
      ...options,
      syntax: new ConstantExpressionParser(valueType),
      valueType
    });
  }
}
