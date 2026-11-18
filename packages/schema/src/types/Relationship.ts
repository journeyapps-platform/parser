import { AbstractObjectTypeFactory } from '../schema/TypeFactory';
import { SchemaModelType } from './SchemaModelType';

export enum RelationshipType {
  ONE_TO_MANY = 'one-to-many',
  MANY_TO_MANY = 'many-to-many',
  ONE_TO_ONE = 'one-to-one'
}

export class Relationship {
  static readonly TYPE = 'relationship';

  type: RelationshipType;

  /** local object type (containing the belongs_to) */
  objectType: SchemaModelType; // TODO

  /** foreign object type (containing the has_many) */
  foreignType: SchemaModelType; // TODO

  /** The name used on the local object to identify the relationship (singular) */
  name: string;

  /** The name used on the foreign object to identify the relationship (plural) */
  foreignName: string;

  constructor() {
    this.type = RelationshipType.ONE_TO_MANY;

    this.objectType = null;
    this.foreignType = null;

    this.name = null;
    this.foreignName = null;
  }
}

export class RelationshipTypeFactory extends AbstractObjectTypeFactory<Relationship> {
  constructor() {
    super(Relationship.TYPE);
  }

  generate(): Relationship {
    return new Relationship();
  }
}
