import {
  Node,
  NodeGenerics,
  ParsedNodeShape,
  ParsedNode,
  ParsedArrayNode,
  ConstantTextAttribute
} from '@ja-platform/parser-core';
import { ConstantExpression } from '@ja-platform/parser-expressions';
import { WebhookReceiver, WebhookType } from '@ja-platform/parser-schema';
import { SchemaNameAttribute } from '../attributes/SchemaNameAttribute';
import { SchemaEnumAttribute } from '../attributes/SchemaEnumAttribute';
import { SchemaWebhookFieldNode, SchemaWebhookFieldShape } from './SchemaWebhookFieldNode';

export interface SchemaWebhookShape extends ParsedNodeShape {
  name?: ConstantExpression<string>;
  type: ConstantExpression<WebhookType>;
  receiver?: ConstantExpression<WebhookReceiver>;
  action?: ConstantExpression<string>;
  fields: ParsedArrayNode<ParsedNode<SchemaWebhookFieldShape>>;
}

export class SchemaWebhookNode extends Node<NodeGenerics<SchemaWebhookShape>> {
  constructor() {
    super({ name: 'webhook', key: 'webhooks', isMultiple: true });
    this.addAttribute(new SchemaNameAttribute({ name: 'name' }));
    this.addAttribute(new SchemaEnumAttribute({ name: 'type', values: Object.values(WebhookType), required: true }));
    this.addAttribute(new SchemaEnumAttribute({ name: 'receiver', values: Object.values(WebhookReceiver) }));
    this.addAttribute(new ConstantTextAttribute({ name: 'action' }));
    this.addNode(new SchemaWebhookFieldNode());
  }
}
