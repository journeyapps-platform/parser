import { EnumValueType } from './EnumValueType';
import type { EvaluatedExpression, ConstantExpression } from '@ja-platform/parser-expressions';
import { Attribute, AttributeGenerics, AttributeOptions } from './Attribute';

export type CombinedEnumExpression<T extends string = string> = EvaluatedExpression | ConstantExpression<T>;

export interface EnumAttributeOptions<T extends string = string> extends AttributeOptions<T, T> {
  options: readonly T[];
}

export interface EnumAttributeGenerics<
  T extends string = string,
  Options extends EnumAttributeOptions<T> = EnumAttributeOptions<T>
> extends AttributeGenerics {
  Value: CombinedEnumExpression<T> | null;
  NormalizedValue: T;
  Options: Options;
}

export class EnumAttribute<
  T extends string = string,
  const Options extends EnumAttributeOptions<T> = EnumAttributeOptions<T>
> extends Attribute<EnumAttributeGenerics<Options['options'][number], Options>> {
  static TYPE = 'set-attribute';

  static isInstanceOf(attr: Attribute): attr is EnumAttribute {
    return attr.type === EnumAttribute.TYPE;
  }

  constructor(options: Options) {
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
