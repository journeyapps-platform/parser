import type { EvaluatedExpression, ConstantExpression } from '@ja-platform/parser-expressions';
import { V5Attribute, V5AttributeGenerics, V5AttributeOptions } from './V5Attribute';
import { V5EditorHelpers } from '../events/V5EditorContext';

export type CombinedListExpression = EvaluatedExpression | ConstantExpression;

export interface V5ListAttributeOptions extends V5AttributeOptions<string[]> {
  options: string[];
  delimiter?: string;
}

export interface V5ListAttributeGenerics extends V5AttributeGenerics {
  Value: CombinedListExpression | null;
  Options: V5ListAttributeOptions;
}

export class V5ListAttribute extends V5Attribute<V5ListAttributeGenerics> {
  static TYPE = 'list-attribute';
  delimiter: string;
  constructor(options: V5ListAttributeGenerics['Options']) {
    super(V5ListAttribute.TYPE, {
      ...options,
      options: options.options || [],
      configurable: options.configurable ?? true
    });
    this.delimiter = options.delimiter ?? ',';
  }

  static isInstanceOf(attr: V5Attribute): attr is V5ListAttribute {
    return attr.type === V5ListAttribute.TYPE;
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

  getEditorV5Syntax<T>(helpers: V5EditorHelpers<T>): T {
    return helpers.dynamicList(this.options.options, this.options.defaultValue);
  }
  serialize(): any {
    return {
      ...super.serialize(),
      type: 'list',
      options: this.options.options
    };
  }
}
