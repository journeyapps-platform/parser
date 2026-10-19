import { ConditionType } from './ConditionType';
import { fanDefaultValue } from './AttributeDefaults';
import {
  DefaultValueKind,
  V5Attribute,
  V5AttributeOptions,
  V5AttributeGenerics,
  DefaultValueType
} from './V5Attribute';
import { V5EditorHelpers } from '../events/V5EditorContext';
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

export interface V5BooleanAttributeGenerics extends V5AttributeGenerics {
  Options: V5AttributeOptions<DefaultValueType<boolean>, boolean>;
  Value: CombinedBooleanExpression | null;
  NormalizedValue: boolean;
}

/**
 * For dealing with boolean attribute types such as `show-if` and `hide-if`
 */
export class V5BooleanAttribute extends V5Attribute<V5BooleanAttributeGenerics> {
  static TYPE = 'boolean-attribute';

  static isInstanceOf(attr: V5Attribute): attr is V5BooleanAttribute {
    return attr.type === V5BooleanAttribute.TYPE;
  }

  constructor(options: V5BooleanAttributeGenerics['Options']) {
    const valueType = options.valueType ?? new ConditionType();
    super(V5BooleanAttribute.TYPE, {
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
      defaultValueKind: DefaultValueKind.SIZE,
      configurable: options.configurable ?? true
    });
    if (typeof this.options.defaultValue == 'boolean') {
      this.options.defaultValue = fanDefaultValue(this.options.defaultValue);
    }
  }

  getEditorV5Syntax<T>(helpers: V5EditorHelpers<T>): T {
    return helpers.typedBindingOrFunction(
      {
        // Do not limit the type to boolean.
        // Very often the developer wants to set something based on the
        // presence of a non-boolean field.
        types: null,
        writable: false,
        constants: true
      },
      this.options.defaultValue == null ? null : '' + this.options.defaultValue
    );
  }

  serialize(): any {
    return {
      ...super.serialize(),
      type: 'boolean'
    };
  }
}
