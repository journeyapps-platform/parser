import { Schema, SchemaModelType, Field, Param } from '@ja-platform/parser-schema';

export interface FieldJson {
  name: string;
  type: string;
  label?: string;
  [key: string]: any;
}

export function serializeField(field: Field): FieldJson {
  const result: FieldJson = { name: field.name, type: field.type?.name };
  if (field.label !== undefined) result.label = field.label;
  if (field.type != null && !SchemaModelType.isInstanceOf(field.type)) {
    Object.assign(result, field.type.toJSON());
  }
  if (field.relationship != null) {
    result.relationship = field.relationship;
    result.isRelationshipId = field.isRelationshipId;
  }
  if (field instanceof Param) {
    if (field.required != null) result.required = field.required;
    if (field.provideValue != null) result.provideValue = field.provideValue.raw();
  }
  return result;
}

/**
 * Preserve the existing runtime wire format; XML-only metadata is not serialized.
 */
export function serializeSchema(schema: Schema) {
  return {
    objects: Object.fromEntries(
      Object.entries(schema.objects).map(([name, model]) => [
        name,
        {
          label: model.label,
          attributes: Object.fromEntries(
            Object.entries(model.attributes).map(([key, field]) => [key, serializeField(field)])
          ),
          belongsTo: Object.fromEntries(
            Object.entries(model.belongsTo).map(([key, relationship]) => [
              key,
              {
                type: relationship.foreignType.name,
                foreignName: relationship.foreignName
              }
            ])
          ),
          hasMany: {},
          display: model.displayFormat?.raw() ?? ''
        }
      ])
    )
  };
}
