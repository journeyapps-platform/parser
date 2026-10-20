import { SchemaModelType } from '../types/SchemaModelType';
import { Param } from '../types/Param';
import { PrimitiveTypeInstance, PrimitiveTypeMap, PrimitiveTypeName } from '../types/primitives';
import { Relationship } from '../types/Relationship';
import { Field } from '../types/Field';
import { Schema } from './Schema';

export interface TypeFactory<NAME extends string = string> {
  name: NAME;
  generate: <T>(event?: any) => any;
}

export interface GenerateTypeEvent {
  schema: Schema;
}

export type ObjectTypeInstance = Field<any> | Param | SchemaModelType | Relationship;

export type ObjectTypeName =
  typeof Param.TYPE | typeof Field.TYPE | typeof SchemaModelType.TYPE | typeof Relationship.TYPE;

export abstract class AbstractObjectTypeFactory<
  R extends ObjectTypeInstance = ObjectTypeInstance,
  E extends GenerateTypeEvent = GenerateTypeEvent
> implements TypeFactory<ObjectTypeName> {
  name: ObjectTypeName;

  constructor(name: ObjectTypeName) {
    this.name = name;
  }

  abstract generate<T>(event: E): R;
}

export class PrimitiveTypeFactory<
  T extends PrimitiveTypeInstance,
  E extends GenerateTypeEvent = GenerateTypeEvent
> implements TypeFactory<PrimitiveTypeName> {
  name: PrimitiveTypeName;
  constructor(name: PrimitiveTypeName) {
    this.name = name;
  }
  generate(event: E): T {
    const instance = new PrimitiveTypeMap[this.name]();
    return instance as T;
  }
}
