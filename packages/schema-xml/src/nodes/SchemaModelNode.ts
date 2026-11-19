import {
  Node,
  NodeGenerics,
  ParsedNodeShape,
  ParsedNode,
  ParsedArrayNode,
  ConstantTextAttribute,
  ParseTreeOptions
} from '@ja-platform/parser-core';
import { ConstantExpression } from '@ja-platform/parser-expressions';
import { SchemaNameAttribute } from '../attributes/SchemaNameAttribute';
import { SchemaEnumAttribute } from '../attributes/SchemaEnumAttribute';
import { SchemaFieldNode } from './SchemaFieldNode';
import { ParsedSchemaFieldNode } from '../parsed/ParsedSchemaFieldNode';
import { ParsedSchemaModelNode } from '../parsed/ParsedSchemaModelNode';
import { SchemaBelongsToNode, SchemaBelongsToShape } from './SchemaBelongsToNode';
import { SchemaHasManyNode, SchemaHasManyShape } from './SchemaHasManyNode';
import { SchemaIndexNode, SchemaIndexShape } from './SchemaIndexNode';
import { SchemaDisplayNode, SchemaDisplayShape } from './SchemaDisplayNode';
import { SchemaNotificationNode, SchemaNotificationShape } from './SchemaNotificationNode';
import { SchemaWebhookNode, SchemaWebhookShape } from './SchemaWebhookNode';

export interface SchemaModelShape extends ParsedNodeShape {
  name: ConstantExpression<string>;
  label: ConstantExpression<string>;
  classification?: ConstantExpression<string>;
  fields: ParsedArrayNode<ParsedSchemaFieldNode>;
  belongsTo: ParsedArrayNode<ParsedNode<SchemaBelongsToShape>>;
  hasMany: ParsedArrayNode<ParsedNode<SchemaHasManyShape>>;
  indexes: ParsedArrayNode<ParsedNode<SchemaIndexShape>>;
  display?: ParsedNode<SchemaDisplayShape>;
  notifications: ParsedArrayNode<ParsedNode<SchemaNotificationShape>>;
  webhooks: ParsedArrayNode<ParsedNode<SchemaWebhookShape>>;
}

export class SchemaModelNode extends Node<NodeGenerics<SchemaModelShape, ParsedSchemaModelNode>> {
  constructor() {
    super({ name: 'model', key: 'models', isMultiple: true });
    this.addAttribute(new SchemaNameAttribute({ name: 'name', required: true }));
    this.addAttribute(new ConstantTextAttribute({ name: 'label', required: true }));
    this.addAttribute(new SchemaEnumAttribute({ name: 'classification', values: ['standard', 'sensitive'] }));
    this.addNode(new SchemaFieldNode());
    this.addNode(new SchemaBelongsToNode());
    this.addNode(new SchemaHasManyNode());
    this.addNode(new SchemaIndexNode());
    this.addNode(new SchemaDisplayNode());
    this.addNode(new SchemaNotificationNode());
    this.addNode(new SchemaWebhookNode());
  }

  protected createParsedNode(options: ParseTreeOptions): ParsedSchemaModelNode {
    return new ParsedSchemaModelNode({ definition: this, ...options });
  }
}
