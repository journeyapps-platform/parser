import { AbstractToken } from './AbstractToken';

/**
 * Commas or whitespace, preserved with their original source position.
 */
export class DelimiterToken extends AbstractToken {
  constructor(
    readonly source: string,
    start = 0
  ) {
    super(start);
    Object.freeze(this);
  }

  raw(): string {
    return this.source;
  }

  clone(): this {
    return this;
  }
}
