import type { EvaluatedExpression, ConstantExpression } from '@ja-platform/parser-expressions';
import { Attribute, AttributeGenerics, AttributeOptions } from './Attribute';

export type CombinedListExpression = EvaluatedExpression | ConstantExpression;

export interface ListAttributeOptions extends AttributeOptions<string[]> {
  options: string[];
  delimiter?: string;
}

export interface ListAttributeGenerics<
  Options extends ListAttributeOptions = ListAttributeOptions
> extends AttributeGenerics {
  Value: CombinedListExpression | null;
  Options: Options;
}

export class ListAttribute<Options extends ListAttributeOptions = ListAttributeOptions> extends Attribute<
  ListAttributeGenerics<Options>
> {
  static TYPE = 'list-attribute';
  delimiter: string;
  constructor(options: Options) {
    super(ListAttribute.TYPE, {
      ...options,
      options: options.options || [],
      configurable: options.configurable ?? true
    });
    this.delimiter = options.delimiter ?? ',';
  }

  static isInstanceOf(attr: Attribute): attr is ListAttribute {
    return attr.type === ListAttribute.TYPE;
  }

  static toList(value: any, delimiter = ','): any[] {
    if (value == null) {
      return null;
    } else if (Array.isArray(value)) {
      return value;
    } else if (typeof value === 'string' || value instanceof String) {
      return `${value}`.split(delimiter);
    } else {
      // Value might be an object, which will be resolved elsewhere
      return value;
    }
  }
  serialize(): any {
    return {
      ...super.serialize(),
      type: 'list',
      options: this.options.options
    };
  }
}
