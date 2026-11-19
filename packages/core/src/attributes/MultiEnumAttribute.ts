import { ArrayType } from '@ja-platform/parser-type-system';
import { EnumValueType } from './EnumValueType';
import { ConstantExpression, EvaluatedExpression, ListExpressionParser } from '@ja-platform/parser-expressions';
import { Attribute, AttributeGenerics, AttributeOptions } from './Attribute';

export type CombinedMultiEnumExpression<T extends string = string> = EvaluatedExpression | ConstantExpression<T[]>;

export interface MultiEnumAttributeOptions<T extends string = string> extends AttributeOptions<T[], T[]> {
  options: readonly T[];
}

export interface MultiEnumAttributeGenerics<
  T extends string = string,
  Options extends MultiEnumAttributeOptions<T> = MultiEnumAttributeOptions<T>
> extends AttributeGenerics {
  Value: CombinedMultiEnumExpression<T> | null;
  NormalizedValue: T[];
  Options: Options;
}

export class MultiEnumAttribute<
  T extends string = string,
  const Options extends MultiEnumAttributeOptions<T> = MultiEnumAttributeOptions<T>
> extends Attribute<MultiEnumAttributeGenerics<Options['options'][number], Options>> {
  static TYPE = 'list-attribute';

  static isInstanceOf(attr: Attribute): attr is MultiEnumAttribute {
    return attr.type === MultiEnumAttribute.TYPE;
  }

  constructor(options: Options) {
    const itemType = new EnumValueType(options.options);
    const valueType = options.valueType ?? new ArrayType(itemType);
    super(
      MultiEnumAttribute.TYPE,
      { ...options, valueType, configurable: options.configurable ?? true },
      ListExpressionParser.enumConstants(itemType, valueType)
    );
  }

  normalizeValue(value: unknown) {
    if (typeof value === 'string') {
      return super.normalizeValue([value]);
    }
    return super.normalizeValue(value);
  }

  serialize(): any {
    return {
      ...super.serialize(),
      type: 'list',
      options: this.options.options
    };
  }
}
