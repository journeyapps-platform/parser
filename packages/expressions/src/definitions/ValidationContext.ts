import type { ReferencePath } from '../tokens/code/CodeToken';
import type { Type } from '@ja-platform/parser-type-system';

/**
 * Resolve declared references for expression validation without reading or evaluating values.
 */
export interface ValidationContext {
  getReference(path: ReferencePath): Type | null;
}
