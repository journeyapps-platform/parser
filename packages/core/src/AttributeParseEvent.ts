import type { XMLPositional } from '@journeyapps/common-xml';
import type { XMLParseEvent } from './XMLParseEvent';
import type { ParsedNode } from './parsed/ParsedNode';

export interface AttributeParseInput {
  value: string | null;
  source: XMLPositional;
}

/**
 * An XML parse event with the input selected for an attribute codec.
 */
export interface AttributeParseEvent<Node extends ParsedNode<any, any> = any> extends XMLParseEvent<Node> {
  input: AttributeParseInput & { value: string };
}
