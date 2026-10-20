import { V5ConstantTextAttribute, V5AttributeOptions } from '@ja-platform/parser-core';
import { TextType } from '@ja-platform/parser-type-system';
import { attribute } from '@journeyapps/common-xml';

class SchemaNameType extends TextType {
  parse(value: unknown): string {
    try {
      return attribute.name(super.parse(value));
    } catch (error) {
      throw new SyntaxError(error.message);
    }
  }
}

export class SchemaNameAttribute extends V5ConstantTextAttribute {
  constructor(options: V5AttributeOptions<string, string>) {
    super({ ...options, valueType: new SchemaNameType() });
  }
}
