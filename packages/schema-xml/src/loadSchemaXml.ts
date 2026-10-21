import { XmlSchema as Schema } from './XmlSchema';
import { error, parse } from '@journeyapps/common-xml';
import { SchemaNode } from './SchemaNode';

export interface LoadSchemaXmlOptions {
  source: string;
}

/**
 * Parse schema XML using the node definitions and convert the resulting tree to a schema.
 */
export function loadSchemaXml({ source }: LoadSchemaXmlOptions): Schema {
  const document = parse(source);
  let schema = new Schema();
  schema.errors = [...(document.errors ?? [])];
  if (schema.errors.length) return schema;

  const element = document.documentElement;
  const definition = new SchemaNode();
  if (element?.tagName !== definition.name) {
    schema.errors.push(error(element, `<${definition.name}> root tag expected`));
    return schema;
  }

  const parsed = definition.parseTree({
    event: {
      element,
      helper: {
        pushError: ({ element, message, type }) => schema.errors.push(error(element, message, type))
      }
    }
  });
  schema.parsedNode = parsed;
  if (!schema.errors.some((diagnostic) => !('type' in diagnostic) || diagnostic.type !== 'warning')) {
    const errors = schema.errors;
    schema = parsed.toSchema();
    schema.errors = errors;
  }
  return schema;
}
