import { Node, NodeGenerics, ParsedNodeShape } from '@ja-platform/parser-core';
import { ConstantExpression } from '@ja-platform/parser-expressions';
import { IndexDatabase } from '@ja-platform/parser-schema';
import { SchemaIndexExpression } from '../expressions/SchemaIndexExpression';
import { SchemaDatabasesExpression } from '../expressions/SchemaDatabasesExpression';
import { SchemaNameAttribute } from '../attributes/SchemaNameAttribute';
import { SchemaIndexAttribute } from '../attributes/SchemaIndexAttribute';
import { SchemaDatabaseAttribute } from '../attributes/SchemaDatabaseAttribute';

export interface SchemaIndexShape extends ParsedNodeShape {
  name?: ConstantExpression<string>;
  keys: SchemaIndexExpression;
  databases?: SchemaDatabasesExpression;
}

export class SchemaIndexNode extends Node<NodeGenerics<SchemaIndexShape>> {
  constructor() {
    super({ name: 'index', key: 'indexes', isMultiple: true });
    this.addAttribute(new SchemaNameAttribute({ name: 'name' }));
    this.addAttribute(new SchemaIndexAttribute({ name: 'on', key: 'keys', required: true }));
    this.addAttribute(
      new SchemaDatabaseAttribute({
        name: 'database',
        key: 'databases',
        defaultValue: [IndexDatabase.APP, IndexDatabase.CLOUD]
      })
    );
  }
}
