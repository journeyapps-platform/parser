import { ConstantExpression, ConstantExpressionParser } from '@ja-platform/parser-expressions';
import { textType } from '@ja-platform/parser-type-system';
import { Attribute, AttributeGenerics, AttributeOptions } from './Attribute';

export interface ConstantTextAttributeGenerics extends AttributeGenerics {
  Options: AttributeOptions<string, string>;
  Value: ConstantExpression | null;
  NormalizedValue: string;
}

/**
 * A string attribute that accepts constant text only.
 */
export class ConstantTextAttribute extends Attribute<ConstantTextAttributeGenerics> {
  static TYPE = 'constant-text-attribute';

  static isInstanceOf(attr: Attribute): attr is ConstantTextAttribute {
    return attr.type === ConstantTextAttribute.TYPE;
  }

  constructor(options: ConstantTextAttributeGenerics['Options']) {
    const valueType = options.valueType ?? textType;
    super(ConstantTextAttribute.TYPE, {
      ...options,
      syntax: new ConstantExpressionParser(valueType),
      valueType
    });
  }
}
