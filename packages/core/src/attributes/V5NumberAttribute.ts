import { AttributeParseEvent } from '../AttributeParseEvent';
import { EvaluatedExpression, ConstantExpression } from '@ja-platform/parser-expressions';
import { numberType } from '@ja-platform/parser-type-system';
import { fanDefaultValue } from './AttributeDefaults';
import {
  DefaultValueType,
  DefaultValueKind,
  V5Attribute,
  V5AttributeGenerics,
  V5AttributeOptions
} from './V5Attribute';
import { V5EditorHelpers } from '../events/V5EditorContext';
import type { V5Node } from '../nodes/V5Node';

export type CombinedNumberExpression = EvaluatedExpression | ConstantExpression<number>;

export interface V5NumberAttributeRange {
  min?: number;
  max?: number;
}

export interface V5NumberAttributeOptions extends V5AttributeOptions<DefaultValueType<number>, number> {
  range?: V5NumberAttributeRange;
}

export interface V5NumberAttributeGenerics extends V5AttributeGenerics {
  Options: V5NumberAttributeOptions;
  Value: CombinedNumberExpression | null;
  NormalizedValue: number;
}

export class V5NumberAttribute extends V5Attribute<V5NumberAttributeGenerics> {
  static TYPE = 'number-attribute';

  static isInstanceOf(attr: V5Attribute): attr is V5NumberAttribute {
    return attr.type === V5NumberAttribute.TYPE;
  }

  constructor(options: V5NumberAttributeGenerics['Options']) {
    super(V5NumberAttribute.TYPE, {
      ...options,
      valueType: options.valueType ?? numberType,
      defaultValueKind: DefaultValueKind.SIZE,
      configurable: options.configurable ?? true
    });
    if (typeof this.options.defaultValue == 'number') {
      this.options.defaultValue = fanDefaultValue(this.options.defaultValue);
    }
  }

  protected getParsedValue(event: AttributeParseEvent): V5NumberAttributeGenerics['Value'] {
    const value = event.input.value;
    if (value.trim() === '') {
      return null;
    }
    return super.getParsedValue(event);
  }

  setParent(parent: V5Node<any>) {
    super.setParent(parent);
    parent.registerListener({
      postParse: ({ parsed }) => {
        parsed.registerListener({
          postValidation: ({ context }) => {
            const expression = parsed.attrExpression(this.options.key);
            const { name, range } = this.options;
            if (expression instanceof ConstantExpression && range) {
              const value = expression.value();
              const min = range.min ?? Number.NEGATIVE_INFINITY;
              const max = range.max ?? Number.POSITIVE_INFINITY;
              if (value < min || value > max) {
                context.report({
                  token: expression.tokens[0],
                  message: `${parsed.sourceElement.nodeName}: Attribute ${name}="${expression.raw()}" is outside of allowable range [${min}, ${max}].`
                });
              }
            }
          }
        });
      }
    });
  }

  getEditorV5Syntax<T>(helpers: V5EditorHelpers<T>): T {
    return helpers.typedBindingOrFunction({
      types: ['number'],
      writable: false,
      constants: false
    });
  }
  serialize(): any {
    return {
      ...super.serialize(),
      type: 'number'
    };
  }
}
