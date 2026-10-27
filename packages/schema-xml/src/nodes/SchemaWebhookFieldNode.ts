import { Node, NodeGenerics, ParsedNodeShape, ConstantBooleanAttribute } from '@ja-platform/parser-core';
import { ConstantExpression } from '@ja-platform/parser-expressions';
import { SchemaNameAttribute } from '../attributes/SchemaNameAttribute';
import { SchemaEnumAttribute } from '../attributes/SchemaEnumAttribute';

export interface SchemaWebhookFieldShape extends ParsedNodeShape {
  name: ConstantExpression<string>;
  required?: ConstantExpression<boolean>;
  embed?: ConstantExpression<boolean>;
  state?: ConstantExpression<string>;
}

export class SchemaWebhookFieldNode extends Node<NodeGenerics<SchemaWebhookFieldShape>> {
  constructor() {
    super({ name: 'field', key: 'fields', isMultiple: true });
    this.addAttribute(new SchemaNameAttribute({ name: 'name', required: true }));
    this.addAttribute(new ConstantBooleanAttribute({ name: 'required', defaultValue: true }));
    this.addAttribute(new ConstantBooleanAttribute({ name: 'embed', defaultValue: true }));
    this.addAttribute(
      new SchemaEnumAttribute({ name: 'state', values: ['present', 'uploaded'], defaultValue: 'present' })
    );
  }
}
