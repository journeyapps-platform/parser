import { ParsedNode } from '@ja-platform/parser-core';
import { XmlSchema as Schema } from '../XmlSchema';
import { textSubtypeSpecs } from '@ja-platform/parser-schema';
import { AttachmentType, ChoiceType, DateType, PrimitiveType, TextType } from '@ja-platform/parser-schema';
import { XmlField as Field } from '../XmlField';
import type { SchemaFieldShape } from '../nodes/SchemaFieldNode';

export class ParsedSchemaFieldNode extends ParsedNode<SchemaFieldShape> {
  toField(schema: Schema): Field {
    const declaration = this.attrExpression('type');
    const type = schema.primitive(declaration.primitive);
    const field = schema.field(this.attrExpression('name').value(), type);
    field.label = this.attrExpression('label').value();
    field.sourceTypeName = declaration.raw();
    field.sourceElement = this.sourceElement;
    field.parsedNode = this;

    if (TextType.isInstanceOf(type)) {
      type.spec = this.attrExpression('spec')?.value() ?? null;
      if (declaration.subtype) {
        type.subType = declaration.subtype;
        type.spec = textSubtypeSpecs[declaration.subtype];
      }
    }
    if (DateType.isInstanceOf(type)) {
      type.isDay = true;
    }
    if (AttachmentType.isInstanceOf(type)) {
      if (declaration.primitive === PrimitiveType.ATTACHMENT) {
        type.media = this.attrExpression('media')?.value() ?? null;
      }
      type.autoDownload =
        this.attrExpression('autoDownload')?.value() ?? this.attribute('autoDownload').definition.defaultValue;
    }

    if (ChoiceType.isInstanceOf(type)) {
      const options = this.node('options').nodes();
      const integerKeys =
        declaration.primitive === PrimitiveType.SINGLE_CHOICE_INTEGER ||
        declaration.primitive === PrimitiveType.MULTIPLE_CHOICE_INTEGER;
      let largest = -1;
      for (const [index, option] of options.entries()) {
        const key = option.attrExpression('key')?.value() ?? (integerKeys ? largest + 1 : null);
        const choice = type.addOption(key, option.attrExpression('label').value(), index);
        field.optionSources.set(String(choice.value), option.sourceElement);
        if (integerKeys) largest = Math.max(largest, key as number);
      }
      if (declaration.primitive === PrimitiveType.BOOLEAN && options.length === 0) {
        type.addOption(false, 'No', 0);
        type.addOption(true, 'Yes', 1);
      }
    }
    return field;
  }
}
