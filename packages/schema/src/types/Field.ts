import { AbstractObjectTypeFactory, GenerateTypeEvent } from '../schema/TypeFactory';
import { Type } from '@ja-platform/parser-type-system';

/**
 * A named, resolved field and its schema metadata.
 */
export class Field<T extends Type = Type> {
  static TYPE = 'field';

  static isInstanceOf(obj: any): obj is Field {
    return obj instanceof Field || 'name' in obj;
  }

  name: string;
  type: T | null;
  label?: string;
  relationship?: string;
  isRelationshipId?: boolean;
  isBelongsToId?: boolean;

  constructor(name: string, type: T | null) {
    this.name = name;
    this.type = type;
  }
}

export interface GenerateFieldEvent<T extends Type> extends GenerateTypeEvent {
  name: string;
  type: T;
}

export class FieldFactory<T extends Type = Type> extends AbstractObjectTypeFactory<Field<T>, GenerateFieldEvent<T>> {
  constructor() {
    super(Field.TYPE);
  }
  generate<T extends Type = Type>(event: GenerateFieldEvent<T>): Field<T> {
    return new Field<T>(event.name, event.type);
  }
}
