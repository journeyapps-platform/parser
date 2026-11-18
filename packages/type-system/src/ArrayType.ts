import { Type } from './Type';

/**
 * An array whose items share a value type.
 */
export class ArrayType extends Type {
  readonly _typeName = 'array';
  readonly name = 'array';
  readonly isCollection = true;

  static isInstanceOf(type: Type | null): type is ArrayType {
    return type?._typeName === 'array';
  }

  constructor(readonly itemType: Type) {
    super('array');
  }

  stringify(): string {
    return `${this.name}:${this.itemType.name}`;
  }

  toJSON() {
    return { type: this.name, object: this.itemType.name };
  }
}
