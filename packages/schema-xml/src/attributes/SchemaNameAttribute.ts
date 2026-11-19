import { ConstantTextAttribute, AttributeOptions } from '@ja-platform/parser-core';
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

export class SchemaNameAttribute extends ConstantTextAttribute {
  constructor(options: AttributeOptions<string, string>) {
    super({ ...options, valueType: new SchemaNameType() });
  }
}
