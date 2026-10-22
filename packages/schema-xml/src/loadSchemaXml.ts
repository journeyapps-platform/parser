import { XmlSchema as Schema } from './XmlSchema';
import { DOMParser } from '@journeyapps/domparser';
import { SchemaNode } from './SchemaNode';
import { XMLNodeInput, XMLSourceReference } from '@ja-platform/parser-document-xml';
import type { ParsedDiagnostic } from '@ja-platform/parser-core';

export interface LoadSchemaXmlOptions {
  source: string;
}

/**
 * Parse schema XML using the node definitions and convert the resulting tree to a schema.
 */
export function loadSchemaXml({ source }: LoadSchemaXmlOptions): Schema {
  const document = new DOMParser().parseFromString(source, 'text/xml');
  let schema = new Schema();
  schema.errors = (document.errors ?? []).map((error) => ({
    message: error.message,
    type: 'error',
    source: { range: { start: error.startOffset, end: error.endOffset ?? error.startOffset } }
  }));
  if (schema.errors.length) return schema;

  const element = document.documentElement;
  const definition = new SchemaNode();
  if (element?.tagName !== definition.name) {
    const diagnostic: ParsedDiagnostic = {
      message: `<${definition.name}> root tag expected`,
      type: 'error'
    };
    if (element) diagnostic.source = new XMLSourceReference(element, source);
    schema.errors.push(diagnostic);
    return schema;
  }

  const parsed = definition.parseTree({
    input: new XMLNodeInput(element, source),
    report: (diagnostic) => schema.errors.push(diagnostic)
  });
  schema.parsedNode = parsed;
  if (!schema.errors.some((diagnostic) => diagnostic.type !== 'warning')) {
    const errors = schema.errors;
    schema = parsed.toSchema();
    schema.errors = errors;
  }
  return schema;
}
