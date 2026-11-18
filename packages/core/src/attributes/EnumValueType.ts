import { Type } from '@ja-platform/parser-type-system';

export class EnumValueType<T extends string> extends Type<T> {
  constructor(readonly options: readonly T[]) {
    super('enum');
  }

  is(value: unknown): value is T {
    return this.options.some((option) => option === value);
  }

  parse(value: unknown): T {
    if (this.is(value)) return value;
    throw new SyntaxError(`Expected one of ${this.options.join(', ')}`);
  }
}
