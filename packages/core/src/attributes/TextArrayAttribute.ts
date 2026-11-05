import { Type, textType } from '@ja-platform/parser-type-system';
import { Attribute } from './Attribute';
import { ListAttribute } from './ListAttribute';
import { TextAttribute, TextAttributeGenerics, TextAttributeOptions } from './TextAttribute';

export interface TextArrayAttributeOptions extends TextAttributeOptions<string[]> {
  delimiter?: string;
}

export interface TextArrayAttributeGenerics extends TextAttributeGenerics<string[]> {
  Options: TextArrayAttributeOptions;
}

class TextArrayType extends Type<string[]> {
  constructor(private readonly delimiter: string) {
    super('text-array');
  }

  is(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(textType.is);
  }

  parse(value: unknown): string[] {
    return ListAttribute.toList(value, this.delimiter);
  }
}

export class TextArrayAttribute extends TextAttribute<TextArrayAttributeGenerics> {
  static TYPE = 'text-array';
  delimiter: string;

  static isInstanceOf(attr: Attribute): attr is TextArrayAttribute {
    return attr.type === TextArrayAttribute.TYPE;
  }

  constructor(options: TextArrayAttributeGenerics['Options']) {
    const delimiter = options.delimiter ?? ',';
    super({
      ...options,
      valueType: options.valueType ?? new TextArrayType(delimiter),
      configurable: options.configurable ?? true,
      advanced: true
    });
    this.type = TextArrayAttribute.TYPE;
    this.delimiter = delimiter;
  }
  serialize(): any {
    return {
      ...super.serialize(),
      type: 'array'
    };
  }
}
