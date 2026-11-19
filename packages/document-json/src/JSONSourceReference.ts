import type { SourceReference } from '@ja-platform/parser-core';
import type { Node } from 'jsonc-parser';

export class JSONSourceReference implements SourceReference {
  constructor(readonly node: Node) {}

  get range() {
    return { start: this.node.offset, end: this.node.offset + this.node.length };
  }
}
