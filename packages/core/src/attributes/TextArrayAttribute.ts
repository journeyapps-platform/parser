import { ArrayType, textType } from '@ja-platform/parser-type-system';
import { Attribute } from './Attribute';
import { TextAttribute, TextAttributeGenerics, TextAttributeOptions } from './TextAttribute';

export type TextArrayAttributeOptions = TextAttributeOptions<string[]>;

export interface TextArrayAttributeGenerics extends TextAttributeGenerics<string[]> {
  Options: TextArrayAttributeOptions;
}

const textArrayType = new ArrayType(textType);

export class TextArrayAttribute extends TextAttribute<TextArrayAttributeGenerics> {
  static TYPE = 'text-array';

  static isInstanceOf(attr: Attribute): attr is TextArrayAttribute {
    return attr.type === TextArrayAttribute.TYPE;
  }

  constructor(options: TextArrayAttributeGenerics['Options']) {
    super({
      ...options,
      valueType: options.valueType ?? textArrayType,
      configurable: options.configurable ?? true,
      advanced: true
    });
    this.type = TextArrayAttribute.TYPE;
  }

  normalizeValue(value: unknown): string[] {
    if (typeof value === 'string') return super.normalizeValue([value]);
    return super.normalizeValue(value);
  }

  serialize(): any {
    return {
      ...super.serialize(),
      type: 'array'
    };
  }
}
