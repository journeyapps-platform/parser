import { Type } from './Type';

/**
 * An array whose items share a value type.
 */
export class ArrayType<T = any> extends Type<T[]> {
  static readonly TYPE = 'array';

  readonly _typeName = ArrayType.TYPE;
  readonly name = ArrayType.TYPE;
  readonly isCollection = true;

  static isInstanceOf(type: Type | null): type is ArrayType {
    return type?._typeName === ArrayType.TYPE;
  }

  constructor(readonly itemType: Type<T>) {
    super(ArrayType.TYPE);
  }

  is(value: unknown): value is T[] {
    return Array.isArray(value) && value.every((item) => this.itemType.is(item));
  }

  parse(value: unknown): T[] {
    if (this.is(value)) {
      return value;
    }
    if (!Array.isArray(value)) {
      throw new SyntaxError(`Expected an array of ${this.itemType.name}`);
    }
    return value.map((item) => this.itemType.parse(item));
  }

  stringify(): string {
    return `${this.name}:${this.itemType.name}`;
  }

  toJSON() {
    return { type: this.name, object: this.itemType.name };
  }
}
