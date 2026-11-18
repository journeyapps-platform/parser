import { Type } from './Type';

/**
 * An array whose items share a value type.
 */
export class ArrayType<T = any> extends Type<T[]> {
  readonly _typeName = 'array';
  readonly name = 'array';
  readonly isCollection = true;

  static isInstanceOf(type: Type | null): type is ArrayType {
    return type?._typeName === 'array';
  }

  constructor(readonly itemType: Type<T>) {
    super('array');
  }

  is(value: unknown): value is T[] {
    return Array.isArray(value) && value.every((item) => this.itemType.is(item));
  }

  parse(value: unknown): T[] {
    if (this.is(value)) return value;
    if (!Array.isArray(value)) throw new SyntaxError(`Expected an array of ${this.itemType.name}`);
    return value.map((item) => this.itemType.parse(item));
  }

  stringify(): string {
    return `${this.name}:${this.itemType.name}`;
  }

  toJSON() {
    return { type: this.name, object: this.itemType.name };
  }
}
