import { V5Node, V5NodeGenerics, ParsedNodeShape } from '@ja-platform/parser-core';
import { ConstantExpression } from '@ja-platform/parser-expressions';
import { SchemaNameAttribute } from '../attributes/SchemaNameAttribute';

export interface SchemaHasManyShape extends ParsedNodeShape {
  name: ConstantExpression<string>;
  model: ConstantExpression<string>;
  inverseOf?: ConstantExpression<string>;
}

export class SchemaHasManyNode extends V5Node<V5NodeGenerics<SchemaHasManyShape>> {
  constructor() {
    super({ name: 'has-many', key: 'hasMany', isMultiple: true });
    this.addAttribute(new SchemaNameAttribute({ name: 'name', required: true }));
    this.addAttribute(new SchemaNameAttribute({ name: 'model', required: true }));
    this.addAttribute(new SchemaNameAttribute({ name: 'inverse-of', key: 'inverseOf' }));
  }
}
