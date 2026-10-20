import { V5Node, V5NodeGenerics, ParsedNodeShape, ContentValueAttribute } from '@ja-platform/parser-core';
import { ConstantExpression, ConstantExpressionParser } from '@ja-platform/parser-expressions';
import { textType } from '@ja-platform/parser-type-system';
import { SchemaOptionKey, SchemaOptionKeyAttribute } from '../attributes/SchemaOptionKeyAttribute';

export interface SchemaOptionShape extends ParsedNodeShape {
  key?: ConstantExpression<SchemaOptionKey>;
  label: ConstantExpression<string>;
}

export class SchemaOptionNode extends V5Node<V5NodeGenerics<SchemaOptionShape>> {
  constructor() {
    super({ name: 'option', key: 'options', isMultiple: true });
    this.addAttribute(new SchemaOptionKeyAttribute());
    this.addAttribute(
      new ContentValueAttribute('schema-option-label', {
        name: 'label',
        valueType: textType,
        syntax: new ConstantExpressionParser(textType)
      })
    );
  }
}
