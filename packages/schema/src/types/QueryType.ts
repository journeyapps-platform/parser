import { Type, ObjectType } from '@ja-platform/parser-type-system';

/**
 * A query whose results share a value type.
 */
export class QueryType extends Type {
  static readonly TYPE = 'query';

  readonly _typeName = QueryType.TYPE;
  readonly name = QueryType.TYPE;
  readonly isCollection = true;

  static isInstanceOf(type: Type | null): type is QueryType {
    return type?._typeName === QueryType.TYPE;
  }

  constructor(readonly itemType: Type) {
    super(QueryType.TYPE);
  }

  is(value: any): boolean {
    return (
      ObjectType.isInstanceOf(value?.type) &&
      value.type.name === this.itemType.name &&
      typeof value._fetch === 'function'
    );
  }

  parse(value: unknown): unknown {
    if (this.is(value)) return value;
    throw new Error(`Expected value to have query type ${this.itemType.name}`);
  }

  stringify(): string {
    return `${this.name}:${this.itemType.name}`;
  }

  toJSON() {
    return { type: this.name, object: this.itemType.name };
  }
}
