import { EnumValueType } from './EnumValueType';
import type { EvaluatedExpression, ConstantExpression } from '@ja-platform/parser-expressions';
import { Attribute, AttributeGenerics, AttributeOptions } from './Attribute';

export type CombinedEnumExpression<T extends string = string> = EvaluatedExpression | ConstantExpression<T>;

export interface EnumAttributeOptions<T extends string = string> extends AttributeOptions<T, T> {
  options: readonly T[];
}

export interface EnumAttributeGenerics<T extends string = string> extends AttributeGenerics {
  Value: CombinedEnumExpression<T> | null;
  NormalizedValue: T;
  Options: EnumAttributeOptions<T>;
}

export class EnumAttribute<const T extends string = string> extends Attribute<EnumAttributeGenerics<T>> {
  static TYPE = 'set-attribute';

  static isInstanceOf(attr: Attribute): attr is EnumAttribute {
    return attr.type === EnumAttribute.TYPE;
  }

  constructor(options: EnumAttributeOptions<T>) {
    super(EnumAttribute.TYPE, {
      ...options,
      valueType: options.valueType ?? new EnumValueType(options.options),
      configurable: options.configurable ?? true
    });
  }

  serialize(): any {
    return {
      ...super.serialize(),
      type: 'set',
      options: this.options.options
    };
  }
}
