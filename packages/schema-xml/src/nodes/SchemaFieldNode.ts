import {
  Node,
  NodeGenerics,
  ParsedNodeShape,
  ParsedNode,
  ParsedArrayNode,
  ConstantTextAttribute,
  ConstantBooleanAttribute,
  ParseTreeOptions
} from '@ja-platform/parser-core';
import { ConstantExpression } from '@ja-platform/parser-expressions';
import { SchemaFieldTypeAttribute } from '../attributes/SchemaFieldTypeAttribute';
import { SchemaFieldTypeExpression } from '../expressions/SchemaFieldTypeExpression';
import { SchemaNameAttribute } from '../attributes/SchemaNameAttribute';
import { SchemaEnumAttribute } from '../attributes/SchemaEnumAttribute';
import { ATTACHMENT_MEDIA_TYPES } from '@ja-platform/parser-schema';
import { SchemaOptionNode, SchemaOptionShape } from './SchemaOptionNode';
import { ParsedSchemaFieldNode } from '../parsed/ParsedSchemaFieldNode';

export interface SchemaFieldShape extends ParsedNodeShape {
  name: ConstantExpression<string>;
  label: ConstantExpression<string>;
  type: SchemaFieldTypeExpression;
  media?: ConstantExpression<string>;
  autoDownload?: ConstantExpression<boolean>;
  spec?: ConstantExpression<string>;
  deprecatedSpec?: ConstantExpression<string>;
  minValue?: ConstantExpression<string>;
  maxValue?: ConstantExpression<string>;
  options: ParsedArrayNode<ParsedNode<SchemaOptionShape>>;
}

export class SchemaFieldNode extends Node<NodeGenerics<SchemaFieldShape, ParsedSchemaFieldNode>> {
  constructor() {
    super({ name: 'field', key: 'fields', isMultiple: true });
    this.addAttribute(new SchemaNameAttribute({ name: 'name', required: true }));
    this.addAttribute(new ConstantTextAttribute({ name: 'label', required: true }));
    this.addAttribute(new SchemaFieldTypeAttribute({ name: 'type', required: true }));
    this.addAttribute(new SchemaEnumAttribute({ name: 'media', values: ATTACHMENT_MEDIA_TYPES }));
    this.addAttribute(
      new ConstantBooleanAttribute({ name: 'auto-download', key: 'autoDownload', defaultValue: false })
    );
    this.addAttribute(new ConstantTextAttribute({ name: 'spec', deprecated: true }));
    this.addAttribute(new ConstantTextAttribute({ name: 'deprecated-spec', key: 'deprecatedSpec', deprecated: true }));
    this.addAttribute(new ConstantTextAttribute({ name: 'minValue', deprecated: true }));
    this.addAttribute(new ConstantTextAttribute({ name: 'maxValue', deprecated: true }));
    this.addNode(new SchemaOptionNode());
  }

  protected createParsedNode(options: ParseTreeOptions): ParsedSchemaFieldNode {
    return new ParsedSchemaFieldNode({ definition: this, ...options });
  }
}
