import { V5Node, V5NodeGenerics, ParsedNodeShape, V5Attribute } from '@ja-platform/parser-core';
import { ConstantExpression } from '@ja-platform/parser-expressions';
import { SchemaObjectDisplayExpression, SchemaObjectDisplayExpressionParser } from '@ja-platform/parser-schema';
import { SchemaNameAttribute } from '../attributes/SchemaNameAttribute';

export interface SchemaNotificationShape extends ParsedNodeShape {
  message: SchemaObjectDisplayExpression;
  received: ConstantExpression<string>;
  recipient: ConstantExpression<string>;
  badgeCount?: ConstantExpression<string>;
}

export class SchemaNotificationNode extends V5Node<V5NodeGenerics<SchemaNotificationShape>> {
  constructor() {
    super({ name: 'notify-user', key: 'notifications', isMultiple: true });
    this.addAttribute(
      new V5Attribute('schema-notification-message', {
        name: 'message',
        required: true,
        syntax: new SchemaObjectDisplayExpressionParser()
      })
    );
    this.addAttribute(new SchemaNameAttribute({ name: 'received-field', key: 'received', required: true }));
    this.addAttribute(new SchemaNameAttribute({ name: 'recipient-field', key: 'recipient', required: true }));
    this.addAttribute(new SchemaNameAttribute({ name: 'badge-count-field', key: 'badgeCount' }));
  }
}
