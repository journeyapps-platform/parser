import { SchemaModelType } from '@ja-platform/parser-schema';
import type { XMLElement } from '@journeyapps/domparser/types';
import type { ParsedSchemaModelNode } from './parsed/ParsedSchemaModelNode';
import type { XmlField } from './XmlField';

export class XmlModel extends SchemaModelType {
  parsedNode?: ParsedSchemaModelNode;
  sourceElement?: XMLElement;
  displaySource?: XMLElement;
  declare attributes: Record<string, XmlField>;
  declare belongsToVars: Record<string, XmlField>;
  declare hasManyVars: Record<string, XmlField>;
}
