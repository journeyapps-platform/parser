import type { EvaluatedExpression, ConstantExpression } from '@ja-platform/parser-expressions';
import { Attribute, AttributeGenerics, AttributeOptions } from './Attribute';

export type CombinedSetExpression = EvaluatedExpression | ConstantExpression;

export interface SetAttributeOptions extends AttributeOptions<string> {
  options: string[];
}

export interface SetAttributeGenerics extends AttributeGenerics {
  Value: CombinedSetExpression | null;
  Options: SetAttributeOptions;
}

export class SetAttribute extends Attribute<SetAttributeGenerics> {
  static TYPE = 'set-attribute';
  constructor(options: SetAttributeOptions) {
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
