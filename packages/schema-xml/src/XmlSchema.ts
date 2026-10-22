import { Schema } from '@ja-platform/parser-schema';
import type { Type } from '@ja-platform/parser-type-system';
import type { ParsedDiagnostic } from '@ja-platform/parser-core';
import type { XMLElement } from '@journeyapps/domparser/types';
import type { ParsedSchemaNode } from './parsed/ParsedSchemaNode';
import { XmlField } from './XmlField';
import { XmlParam } from './XmlParam';
import { XmlModel } from './XmlModel';

/**
 * A resolved schema retaining its XML declarations for editing and diagnostics.
 */
export class XmlSchema extends Schema {
  parsedNode?: ParsedSchemaNode;
  sourceElement?: XMLElement;
  errors: ParsedDiagnostic[] = [];
  declare objects: Record<string, XmlModel>;

  field<T extends Type = Type>(name?: string, type?: T | string): XmlField<T> {
    return new XmlField(name, (typeof type === 'string' ? this.getType(type) : type) as T);
  }

  param<T extends Type = Type>(name?: string, type?: T | string): XmlParam<T> {
    return new XmlParam(name, (typeof type === 'string' ? this.getType(type) : type) as T);
  }

  newObjectType(name?: string): XmlModel {
    const model = new XmlModel(name);
    model.setupVariables(this);
    return model;
  }
}
