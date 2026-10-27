import { Param, ParamFactory } from '../types/Param';
import { Field, FieldFactory } from '../types/Field';
import { Relationship, RelationshipTypeFactory } from '../types/Relationship';
import { SchemaModelType, SchemaModelTypeFactory } from '../types/SchemaModelType';
import { Type } from '@ja-platform/parser-type-system';
import { PrimitiveTypeMap, PrimitiveTypeName } from '../types/primitives/PrimitiveTypes';
import { PrimitiveTypeFactory, TypeFactory } from './TypeFactory';

export type InferGetType<
  T extends string | PrimitiveTypeName,
  MAP extends { [key in PrimitiveTypeName]: new (...args: any[]) => Type } = PrimitiveTypeMap,
  Model extends SchemaModelType = SchemaModelType
> = T extends PrimitiveTypeName ? InstanceType<MAP[T]> : Model;

export class Schema {
  typeFactories: { [key: string]: TypeFactory } = {};

  objects: { [index: string]: SchemaModelType };

  // these are used by the tern defs (legacy editor)
  apiVersion?;
  mobileUserType?;

  /**
   * Create an empty resolved schema, independently of its input format.
   */
  constructor() {
    this.objects = {};

    this.registerTypeFactory(new FieldFactory());
    this.registerTypeFactory(new ParamFactory());
    this.registerTypeFactory(new SchemaModelTypeFactory());
    this.registerTypeFactory(new RelationshipTypeFactory());

    // Register all the primitive types
    for (const primitiveName of Object.keys(PrimitiveTypeMap)) {
      this.registerTypeFactory(new PrimitiveTypeFactory(primitiveName as PrimitiveTypeName));
    }
  }

  registerTypeFactory(factory: TypeFactory) {
    this.typeFactories[factory.name] = factory;
  }

  getFactory(name: string) {
    return this.typeFactories[name];
  }

  /** Helper function to assist in creating variables */
  field<T extends Type = Type>(name?: string, type?: string): Field<T>;
  field<T extends Type = Type>(name?: string, type?: T): Field<T>;
  field<T extends Type = Type>(name?: string, type?: T | string): Field<T> {
    const _type = typeof type === 'string' ? this.getType(type) : type;
    return this.getFactory(Field.TYPE).generate<T>({ schema: this, name, type: _type });
  }

  param<T extends Type = Type>(name?: string, type?: string): Param<T>;
  param<T extends Type = Type>(name?: string, type?: T): Param<T>;
  param<T extends Type = Type>(name?: string, type?: T | string): Param<T> {
    const _type = typeof type === 'string' ? this.getType(type) : type;
    return this.getFactory(Param.TYPE).generate<T>({ schema: this, name, type: _type });
  }

  newObjectType(name?: string) {
    return this.getFactory(SchemaModelType.TYPE).generate({ schema: this, name }) as SchemaModelType;
  }

  newRelationship() {
    return this.getFactory(Relationship.TYPE).generate({ schema: this }) as Relationship;
  }

  // Given a type name, return the specified type. Returns `undefined` if the type is not found.
  // The type name may refer to a primitive, or an object type defined in the schema.
  getType<T extends string | PrimitiveTypeName>(typeName: T): InferGetType<T> {
    if (typeName in PrimitiveTypeMap) {
      // primitive
      return this.primitive(typeName);
    }
    // not a primitive - most likely an object
    return this.objects[typeName] as InferGetType<T>;
  }

  primitive<T extends string | PrimitiveTypeName>(name: T): InferGetType<T> {
    if (!(name in PrimitiveTypeMap)) {
      return null;
    }
    const factory = this.getFactory(name);
    if (factory) {
      return factory.generate({ schema: this });
    } else {
      return null;
    }
  }
}
