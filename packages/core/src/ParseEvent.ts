import type { NodeInput } from './input/NodeInput';
import type { AttributeParseContext } from './input/AttributeParseContext';
import type { ParsedNode } from './parsed/ParsedNode';
import type { ValidationContext } from '@ja-platform/parser-expressions';

export interface ParseEvent extends AttributeParseContext {
  input?: NodeInput;
  parsedNode?: ParsedNode;
  scope?: ValidationContext;
  /** Prepare a node after its attributes and before its children are parsed. */
  prepareNode?(node: ParsedNode): void;
}
