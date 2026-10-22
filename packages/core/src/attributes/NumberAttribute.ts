import { AttributeParseEvent } from '../AttributeParseEvent';
import { EvaluatedExpression, ConstantExpression } from '@ja-platform/parser-expressions';
import { numberType } from '@ja-platform/parser-type-system';
import { Attribute, AttributeGenerics, AttributeOptions } from './Attribute';
import type { Node } from '../nodes/Node';

export type CombinedNumberExpression = EvaluatedExpression | ConstantExpression<number>;

export interface NumberAttributeRange {
  min?: number;
  max?: number;
}

export interface NumberAttributeOptions extends AttributeOptions<number, number> {
  range?: NumberAttributeRange;
}

export interface NumberAttributeGenerics extends AttributeGenerics {
  Options: NumberAttributeOptions;
  Value: CombinedNumberExpression | null;
  NormalizedValue: number;
}

export class NumberAttribute extends Attribute<NumberAttributeGenerics> {
  static TYPE = 'number-attribute';

  static isInstanceOf(attr: Attribute): attr is NumberAttribute {
    return attr.type === NumberAttribute.TYPE;
  }

  constructor(options: NumberAttributeGenerics['Options']) {
    super(NumberAttribute.TYPE, {
      ...options,
      valueType: options.valueType ?? numberType,
      configurable: options.configurable ?? true
    });
  }

  protected getParsedValue(event: AttributeParseEvent): NumberAttributeGenerics['Value'] {
    const value = event.input.value;
    if (value.trim() === '') {
      return null;
    }
    return super.getParsedValue(event);
  }

  setParent(parent: Node<any>) {
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
                  message: `${parsed.definition.name}: Attribute ${name}="${expression.raw()}" is outside of allowable range [${min}, ${max}].`
                });
              }
            }
          }
        });
      }
    });
  }
  serialize(): any {
    return {
      ...super.serialize(),
      type: 'number'
    };
  }
}
