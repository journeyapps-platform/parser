import type { EvaluatedExpression, ConstantExpression } from '@ja-platform/parser-expressions';
import { Attribute, AttributeGenerics, AttributeOptions } from './Attribute';

export type CombinedSetExpression = EvaluatedExpression | ConstantExpression;

export interface SetAttributeOptions extends AttributeOptions<string> {
  options: string[];
}

export interface SetAttributeGenerics<
  Options extends SetAttributeOptions = SetAttributeOptions
> extends AttributeGenerics {
  Value: CombinedSetExpression | null;
  Options: Options;
}

export class SetAttribute<Options extends SetAttributeOptions = SetAttributeOptions> extends Attribute<
  SetAttributeGenerics<Options>
> {
  static TYPE = 'set-attribute';
  constructor(options: Options) {
    super(SetAttribute.TYPE, {
      ...options,
      configurable: options.configurable ?? true,
      options: options.options || []
    });
  }

  static isInstanceOf(attr: Attribute): attr is SetAttribute {
    return attr.type === SetAttribute.TYPE;
  }

  serialize(): any {
    return {
      ...super.serialize(),
      type: 'set',
      options: this.options.options
    };
  }
}
