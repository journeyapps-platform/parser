import type { SourceReference } from '@ja-platform/parser-core';
import { getPosition, XMLPositional } from '@journeyapps/common-xml';

export class XMLSourceReference implements SourceReference {
  constructor(
    readonly element: XMLPositional,
    private readonly text: string
  ) {}

  get range() {
    const position = getPosition(this.element);
    if (!position.start || !position.end) {
      throw new Error('XML input does not have source positions');
    }
    const offset = (point: { line: number; column: number }) => {
      let start = 0;
      for (let line = 0; line < point.line; line++) {
        start = this.text.indexOf('\n', start) + 1;
      }
      return start + point.column;
    };
    return { start: offset(position.start), end: offset(position.end) };
  }
}
