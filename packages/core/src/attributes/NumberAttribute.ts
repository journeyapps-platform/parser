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

export interface NumberAttributeOptions<Default = number> extends Omit<
  AttributeOptions<Default, number>,
  'loadingValue'
> {
  loadingValue?: number;
  range?: NumberAttributeRange;
}

export interface NumberAttributeGenerics<
  Default = number,
  Options extends NumberAttributeOptions<Default> = NumberAttributeOptions<Default>
> extends AttributeGenerics {
  Options: Options;
  Value: CombinedNumberExpression | null;
  NormalizedValue: number;
}

export class NumberAttribute<
  Default = number,
  Options extends NumberAttributeOptions<Default> = NumberAttributeOptions<Default>
> extends Attribute<NumberAttributeGenerics<Default, Options>> {
  static TYPE = 'number-attribute';

  static isInstanceOf(attr: Attribute): attr is NumberAttribute<any, any> {
    return attr.type === NumberAttribute.TYPE;
  }

  constructor(options: Options) {
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
