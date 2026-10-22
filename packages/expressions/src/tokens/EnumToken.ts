import { AbstractToken } from './AbstractToken';

/**
 * A fixed grammar symbol, such as an operator or bracket.
 */
export class EnumToken<Value extends string = string> extends AbstractToken {
  constructor(
    readonly value: Value,
    start = 0
  ) {
    super(start);
    Object.freeze(this);
  }

  raw(): Value {
    return this.value;
  }

  clone(): this {
    return this;
  }
}
