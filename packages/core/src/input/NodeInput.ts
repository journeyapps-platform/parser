import type { AttributeInput } from './AttributeInput';
import type { ParsedDiagnostic } from '../parsed/ParsedDiagnostic';
import type { SourceReference } from '../source/SourceReference';

export interface NodeInputSelector {
  name: string;
  key: string;
  isMultiple?: boolean;
}

export interface NodeInputSelection {
  inputs: NodeInput[];
  present: boolean;
  source?: SourceReference;
  diagnostics: ParsedDiagnostic[];
}

export enum NodeInputKind {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  NULL = 'null',
  OBJECT = 'object',
  ARRAY = 'array',
  ELEMENT = 'element'
}

export interface NodeInput {
  readonly kind: NodeInputKind;
  readonly name: string;
  readonly source?: SourceReference;
  /** Names available through attribute(), including JSON object properties. */
  attributeNames(): Iterable<string>;
  attribute(name: string): AttributeInput | undefined;
  content(): AttributeInput | undefined;
  children(): Iterable<NodeInput>;
  /** Select named entries, reporting inputs that cannot represent a record. */
  recordEntries(): NodeInputSelection;
  /** Select declared children in document order, retaining explicit empty collections. */
  selectChildren(selectors: readonly NodeInputSelector[], attributeNames?: readonly string[]): NodeInputSelection;
}
