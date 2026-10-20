import { V5Node, V5NodeGenerics, ParsedNodeShape, V5ContentTextAttribute } from '@ja-platform/parser-core';
import { SchemaObjectDisplayExpression, SchemaObjectDisplayExpressionParser } from '@ja-platform/parser-schema';

export interface SchemaDisplayShape extends ParsedNodeShape {
  format: SchemaObjectDisplayExpression;
}

export class SchemaDisplayNode extends V5Node<V5NodeGenerics<SchemaDisplayShape>> {
  constructor() {
    super({ name: 'display', isRequired: true });
    this.addAttribute(
      new V5ContentTextAttribute({ name: 'format', syntax: new SchemaObjectDisplayExpressionParser() })
    );
  }
}
