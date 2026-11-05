import { Node, NodeGenerics, ParsedNodeShape, ContentTextAttribute } from '@ja-platform/parser-core';
import { SchemaObjectDisplayExpression, SchemaObjectDisplayExpressionParser } from '@ja-platform/parser-schema';

export interface SchemaDisplayShape extends ParsedNodeShape {
  format: SchemaObjectDisplayExpression;
}

export class SchemaDisplayNode extends Node<NodeGenerics<SchemaDisplayShape>> {
  constructor() {
    super({ name: 'display', isRequired: true });
    this.addAttribute(new ContentTextAttribute({ name: 'format', syntax: new SchemaObjectDisplayExpressionParser() }));
  }
}
