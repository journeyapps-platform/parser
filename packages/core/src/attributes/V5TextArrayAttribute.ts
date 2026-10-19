import { Type, textType } from '@ja-platform/parser-type-system';
import { fanDefaultValue } from './AttributeDefaults';
import { ComponentSize, V5Attribute } from './V5Attribute';
import { V5ListAttribute } from './V5ListAttribute';
import { V5TextAttribute, V5TextAttributeGenerics, V5TextAttributeOptions } from './V5TextAttribute';

export interface V5TextArrayAttributeOptions extends V5TextAttributeOptions<string[]> {
  delimiter?: string;
}

export interface V5TextArrayAttributeGenerics extends V5TextAttributeGenerics<string[]> {
  Options: V5TextArrayAttributeOptions;
}

class TextArrayType extends Type<string[]> {
  constructor(private readonly delimiter: string) {
    super('text-array');
  }

  is(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(textType.is);
  }

  parse(value: unknown): string[] {
    return V5ListAttribute.toList(value, this.delimiter);
  }
}

export class V5TextArrayAttribute extends V5TextAttribute<V5TextArrayAttributeGenerics> {
  static TYPE = 'text-array';
  delimiter: string;

  static isInstanceOf(attr: V5Attribute): attr is V5TextArrayAttribute {
    return attr.type === V5TextArrayAttribute.TYPE;
  }

  constructor(options: V5TextArrayAttributeGenerics['Options']) {
    const delimiter = options.delimiter ?? ',';
    super({
      ...options,
      valueType: options.valueType ?? new TextArrayType(delimiter),
      configurable: options.configurable ?? true,
      advanced: true
    });
    this.type = V5TextArrayAttribute.TYPE;
    this.delimiter = delimiter;

    if (Array.isArray(options.defaultValue)) {
      this.options.defaultValue = fanDefaultValue(options.defaultValue) as {
        [k in ComponentSize]: string[];
      };
    }
  }
  serialize(): any {
    return {
      ...super.serialize(),
      type: 'array'
    };
  }
}
