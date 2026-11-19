import type { ParsedNode } from '@ja-platform/parser-core';
import { XMLSourceReference } from '@ja-platform/parser-document-xml';
import type { XMLElement } from '@journeyapps/domparser/types';

/** Recover the original XML node for incremental schema serialization. */
export function sourceElement(node?: ParsedNode): XMLElement | undefined {
  const source = node?.input?.source;
  if (source instanceof XMLSourceReference) return source.element as XMLElement;
}
