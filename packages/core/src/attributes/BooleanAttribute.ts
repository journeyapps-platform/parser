import { ConditionType } from './ConditionType';
import { Attribute, AttributeOptions, AttributeGenerics } from './Attribute';
import {
  EvaluatedExpression,
  ConstantExpression,
  ShorthandExpression,
  CombinedParser,
  FunctionExpressionParser,
  EvaluatedExpressionParser,
  ConstantExpressionParser,
  ShorthandExpressionParser
} from '@ja-platform/parser-expressions';
import { booleanType } from '@ja-platform/parser-type-system';

export type CombinedBooleanExpression = EvaluatedExpression | ConstantExpression<boolean> | ShorthandExpression;

export interface BooleanAttributeGenerics<
  Options extends AttributeOptions<boolean, boolean> = AttributeOptions<boolean, boolean>
> extends AttributeGenerics {
  Options: Options;
  Value: CombinedBooleanExpression | null;
  NormalizedValue: boolean;
}

/**
 * For dealing with boolean attribute types such as `show-if` and `hide-if`
 */
export class BooleanAttribute<
  Options extends AttributeOptions<boolean, boolean> = AttributeOptions<boolean, boolean>
> extends Attribute<BooleanAttributeGenerics<Options>> {
  static TYPE = 'boolean-attribute';

  static isInstanceOf(attr: Attribute): attr is BooleanAttribute {
    return attr.type === BooleanAttribute.TYPE;
  }

  constructor(options: Options) {
    const valueType = options.valueType ?? new ConditionType();
    super(BooleanAttribute.TYPE, {
      ...options,
      valueType,
      syntax:
        options.syntax ??
        new CombinedParser<CombinedBooleanExpression>([
          new FunctionExpressionParser(),
          new EvaluatedExpressionParser(),
          new ShorthandExpressionParser(),
          new ConstantExpressionParser(options.valueType ?? booleanType)
        ]),
      configurable: options.configurable ?? true
    });
  }

  serialize(): any {
    return {
      ...super.serialize(),
      type: 'boolean'
    };
  }
}
