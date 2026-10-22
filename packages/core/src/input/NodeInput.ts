import type { AttributeInput } from './AttributeInput';
import type { SourceReference } from '../source/SourceReference';

export interface NodeInput {
  readonly name: string;
  readonly source?: SourceReference;
  attribute(name: string): AttributeInput | undefined;
  content(): AttributeInput | undefined;
  children(): Iterable<NodeInput>;
}
