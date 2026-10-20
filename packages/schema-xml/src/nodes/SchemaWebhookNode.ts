import {
  V5Node,
  V5NodeGenerics,
  ParsedNodeShape,
  ParsedNode,
  ParsedArrayNode,
  V5ConstantTextAttribute
} from '@ja-platform/parser-core';
import { ConstantExpression } from '@ja-platform/parser-expressions';
import { SchemaNameAttribute } from '../attributes/SchemaNameAttribute';
import { SchemaEnumAttribute } from '../attributes/SchemaEnumAttribute';
import { SchemaWebhookFieldNode, SchemaWebhookFieldShape } from './SchemaWebhookFieldNode';

export interface SchemaWebhookShape extends ParsedNodeShape {
  name?: ConstantExpression<string>;
  type: ConstantExpression<string>;
  receiver?: ConstantExpression<string>;
  action?: ConstantExpression<string>;
  fields: ParsedArrayNode<ParsedNode<SchemaWebhookFieldShape>>;
}

export class SchemaWebhookNode extends V5Node<V5NodeGenerics<SchemaWebhookShape>> {
  constructor() {
    super({ name: 'webhook', key: 'webhooks', isMultiple: true });
    this.addAttribute(new SchemaNameAttribute({ name: 'name' }));
    this.addAttribute(new SchemaEnumAttribute({ name: 'type', values: ['ready', 'update'], required: true }));
    this.addAttribute(new SchemaEnumAttribute({ name: 'receiver', values: ['pdfmailer', 'cloudcode'] }));
    this.addAttribute(new V5ConstantTextAttribute({ name: 'action' }));
    this.addNode(new SchemaWebhookFieldNode());
  }
}
