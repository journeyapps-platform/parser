import type { EvaluatedExpression, ConstantExpression } from '@ja-platform/parser-expressions';
import { V5EditorHelpers } from '../events/V5EditorContext';
import { fanDefaultValue } from './AttributeDefaults';
import {
  ComponentSize,
  DefaultValueType,
  DefaultValueKind,
  V5Attribute,
  V5AttributeGenerics,
  V5AttributeOptions
} from './V5Attribute';

export type CombinedSetExpression = EvaluatedExpression | ConstantExpression;

export interface V5SetAttributeOptions extends V5AttributeOptions<DefaultValueType<string>> {
  options: string[];
}

export interface V5SetAttributeGenerics extends V5AttributeGenerics {
  Value: CombinedSetExpression | null;
  Options: V5SetAttributeOptions;
}

export class V5SetAttribute extends V5Attribute<V5SetAttributeGenerics> {
  static TYPE = 'set-attribute';
  constructor(options: V5SetAttributeOptions) {
    super(V5SetAttribute.TYPE, {
      ...options,
      defaultValueKind: DefaultValueKind.SIZE,
      configurable: options.configurable ?? true,
      options: options.options || []
    });

    if (typeof this.options.defaultValue == 'string') {
      this.options.defaultValue = fanDefaultValue(this.options.defaultValue);
    }
  }

  static isInstanceOf(attr: V5Attribute): attr is V5SetAttribute {
    return attr.type === V5SetAttribute.TYPE;
  }

  getEditorV5Syntax<T>(helpers: V5EditorHelpers<T>): T {
    return helpers.dynamicSet(
      this.options.options,
      (this.options.defaultValue || {})[ComponentSize.MEDIUM] ?? this.options.defaultValue
    );
  }
  serialize(): any {
    return {
      ...super.serialize(),
      type: 'set',
      options: this.options.options
    };
  }
}
