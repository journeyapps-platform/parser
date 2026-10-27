import { Field } from '@ja-platform/parser-schema';
import type { Type } from '@ja-platform/parser-type-system';
import type { XMLElement } from '@journeyapps/domparser/types';
import type { ParsedSchemaFieldNode } from './parsed/ParsedSchemaFieldNode';

export class XmlField<T extends Type = Type> extends Field<T> {
  parsedNode?: ParsedSchemaFieldNode;
  sourceElement?: XMLElement;
  sourceTypeName?: string;
  readonly optionSources = new Map<string, XMLElement>();
}
