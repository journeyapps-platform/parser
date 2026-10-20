import { V5Node, V5NodeGenerics, ParsedNodeShape, ParsedArrayNode, ParseTreeOptions } from '@ja-platform/parser-core';
import { SchemaModelNode } from './nodes/SchemaModelNode';
import { ParsedSchemaNode } from './parsed/ParsedSchemaNode';
import { ParsedSchemaModelNode } from './parsed/ParsedSchemaModelNode';

export interface SchemaShape extends ParsedNodeShape {
  models: ParsedArrayNode<ParsedSchemaModelNode>;
}

/**
 * The schema XML grammar, producing a tree that can be converted to a schema.
 */
export class SchemaDefinition extends V5Node<V5NodeGenerics<SchemaShape, ParsedSchemaNode>> {
  constructor() {
    super({ name: 'data-model' });
    this.addNode(new SchemaModelNode());
  }

  protected createParsedNode(options: ParseTreeOptions): ParsedSchemaNode {
    return new ParsedSchemaNode({ definition: this, ...options });
  }
}
