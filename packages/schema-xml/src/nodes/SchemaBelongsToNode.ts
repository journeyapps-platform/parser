import { Node, NodeGenerics, ParsedNodeShape } from '@ja-platform/parser-core';
import { ConstantExpression } from '@ja-platform/parser-expressions';
import { SchemaNameAttribute } from '../attributes/SchemaNameAttribute';

export interface SchemaBelongsToShape extends ParsedNodeShape {
  name?: ConstantExpression<string>;
  model: ConstantExpression<string>;
}

export class SchemaBelongsToNode extends Node<NodeGenerics<SchemaBelongsToShape>> {
  constructor() {
    super({ name: 'belongs-to', key: 'belongsTo', isMultiple: true });
    this.addAttribute(new SchemaNameAttribute({ name: 'name' }));
    this.addAttribute(new SchemaNameAttribute({ name: 'model', required: true }));
  }
}
