import { ConstantTextAttribute, AttributeOptions } from '@ja-platform/parser-core';
import { TextType } from '@ja-platform/parser-type-system';

/**
 * Schema enums are literal strings, without evaluated syntax or engine size defaults.
 */
class SchemaEnumType extends TextType {
  constructor(readonly values: readonly string[]) {
    super();
  }

  parse(value: unknown): string {
    const text = super.parse(value);
    if (!this.values.includes(text)) throw new SyntaxError(`Expected one of ${this.values.join(', ')}`);
    return text;
  }
}

export class SchemaEnumAttribute extends ConstantTextAttribute {
  constructor(options: AttributeOptions<string, string> & { values: readonly string[] }) {
    super({ ...options, valueType: new SchemaEnumType(options.values) });
  }
}
