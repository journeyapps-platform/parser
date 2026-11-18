import { SchemaObjectDisplayExpression } from '../expressions/SchemaObjectDisplayExpression';
import { QueryType } from './QueryType';
import { ObjectType, Type } from '@ja-platform/parser-type-system';
import { Field } from './Field';
import { Relationship } from './Relationship';
import { Schema } from '../schema/Schema';
import { SchemaError } from '../schema/SchemaError';
import { ModelIndex } from '../schema/ModelIndex';
import { PrimitiveType } from './primitives/PrimitiveTypes';
import { TextType } from './primitives/TextType';
import { AbstractObjectTypeFactory, GenerateTypeEvent } from '../schema/TypeFactory';

export interface NotificationConfig {
  message: SchemaObjectDisplayExpression;
  recipient: string;
  received: string;
  badgeCount: string;
}

export enum WebhookType {
  READY = 'ready',
  UPDATE = 'update'
}

export enum WebhookReceiver {
  CLOUDCODE = 'cloudcode'
}

export enum WebhookFieldState {
  PRESENT = 'present',
  UPLOADED = 'uploaded'
}

export interface WebhookFieldConfig {
  name: string;
  required: boolean;
  embed: boolean;
  state: WebhookFieldState;
}

export interface WebhookConfig {
  name: string;
  type: WebhookType;
  receiver: WebhookReceiver | null;
  action: string | null;
  fields: WebhookFieldConfig[];
}

export class SchemaModelType extends ObjectType {
  static readonly TYPE = 'object';

  static isInstanceOf(type: any): type is SchemaModelType {
    return type?._typeName === SchemaModelType.TYPE;
  }

  attributes: Record<string, Field> = {};
  displayFormat: SchemaObjectDisplayExpression | null;
  label: string;

  belongsTo: Record<string, Relationship>;
  hasMany: Record<string, Relationship>;

  belongsToVars: Record<string, Field>;
  belongsToIdVars: Record<string, Field>;
  hasManyVars: Record<string, Field>;
  idVar: Field<TextType>;

  /**
   * App and Cloud indexes.
   */
  allIndexes: ModelIndex[];
  /**
   * App indexes.
   */
  indexes: ModelIndex[];
  webhooks: WebhookConfig[];
  notifyUsers: NotificationConfig[];

  constructor(name?: string) {
    super(name);

    this.displayFormat = null;
    this.belongsTo = {};
    this.hasMany = {};
    this.belongsToVars = {};
    this.belongsToIdVars = {};
    this.hasManyVars = {};
    this.indexes = [];
    this.allIndexes = [];
    this.webhooks = [];

    this.notifyUsers = [];
  }

  addAttribute(attribute: Field): void {
    this.attributes[attribute.name] = attribute;
  }

  setupVariables(schema: Schema) {
    this.idVar = schema.field('id', PrimitiveType.TEXT);
  }

  /**
   * Attribute or relationship variable.
   */
  getAttribute(name: string): Field | null {
    if (Object.prototype.hasOwnProperty.call(this.attributes, name)) {
      return this.attributes[name];
    } else if (Object.prototype.hasOwnProperty.call(this.belongsToVars, name)) {
      return this.belongsToVars[name];
    } else if (Object.prototype.hasOwnProperty.call(this.belongsToIdVars, name)) {
      return this.belongsToIdVars[name];
    } else if (Object.prototype.hasOwnProperty.call(this.hasManyVars, name)) {
      return this.hasManyVars[name];
    } else if (name == 'id') {
      return this.idVar;
    } else {
      return null;
    }
  }

  getField(name: string): Type | null {
    return this.getAttribute(name)?.type ?? null;
  }

  getAttributes(): { [index: string]: Field } {
    return {
      ...this.hasManyVars,
      ...this.belongsToIdVars,
      ...this.belongsToVars,
      ...this.attributes,
      id: this.idVar
    };
  }

  addBelongsTo(options: { schema: Schema; type?: string; foreignName?: string; name: string }) {
    const schema = options.schema;
    const rel = schema.newRelationship();
    const typeName = options.type;
    const foreignName = options.foreignName;
    if (typeName != null) {
      let name = options.name;
      if (name == null || name === '') {
        name = typeName;
      }
      rel.name = name;
      rel.objectType = this;
      rel.foreignType = schema.objects[typeName];
      if (rel.foreignType == null) {
        throw new SchemaError(`Object '${typeName}' is not defined`, 'type');
      }

      if (this.belongsTo.hasOwnProperty(name)) {
        throw new SchemaError(`Relationship '${name}' is already defined`, 'name');
      } else {
        this.belongsTo[name] = rel;

        // For type lookups
        this.belongsToVars[name] = schema.field(name, rel.foreignType);
        this.belongsToVars[name].relationship = name;

        const idVar = schema.field(name + '_id', PrimitiveType.TEXT);
        idVar.relationship = name;
        idVar.isBelongsToId = true;
        this.belongsToIdVars[idVar.name] = idVar;
      }

      if (foreignName != null) {
        rel.foreignName = foreignName;
        rel.foreignType.hasMany[foreignName] = rel;
        rel.foreignType.hasManyVars[foreignName] = schema.field(foreignName, new QueryType(this));
      }
      return rel;
    }
    return null;
  }
}

export interface GenerateSchemaModelTypeEvent extends GenerateTypeEvent {
  name?: string;
}

export class SchemaModelTypeFactory extends AbstractObjectTypeFactory<SchemaModelType, GenerateSchemaModelTypeEvent> {
  constructor() {
    super(SchemaModelType.TYPE);
  }

  generate(event: GenerateSchemaModelTypeEvent) {
    const instance = new SchemaModelType(event.name);
    instance.setupVariables(event.schema);
    return instance;
  }
}
