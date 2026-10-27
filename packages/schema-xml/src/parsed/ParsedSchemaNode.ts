import { sourceElement } from './sourceElement';
import { ParsedNode } from '@ja-platform/parser-core';
import { XmlSchema as Schema } from '../XmlSchema';
import type { SchemaShape } from '../SchemaNode';

export class ParsedSchemaNode extends ParsedNode<SchemaShape> {
  /**
   * Construct a fresh schema from the parsed declarations, then link its relationships.
   * Validation remains an explicit, separate operation on the parsed tree.
   */
  toSchema(): Schema {
    const schema = new Schema();
    schema.sourceElement = sourceElement(this);
    schema.parsedNode = this;
    const models = this.node('models').nodes();
    const objects = models.map((model) => model.toModel(schema));
    schema.objects = Object.fromEntries(objects.map((model) => [model.name, model]));
    for (const [index, model] of models.entries()) {
      model.resolveBelongsTo({ schema, model: objects[index] });
    }
    for (const [index, model] of models.entries()) {
      model.resolveHasMany({ schema, model: objects[index] });
    }
    return schema;
  }
}
