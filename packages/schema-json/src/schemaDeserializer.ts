import {
  Schema,
  Field,
  Param,
  QueryType,
  ChoiceType,
  TextType,
  DateType,
  parseParameterValueProvider,
  SchemaObjectDisplayExpression
} from '@ja-platform/parser-schema';
import { ArrayType } from '@ja-platform/parser-type-system';
import type { FieldJson, serializeSchema } from './schemaSerializer';

/**
 * Restore metadata on a field whose type has already been resolved.
 */
export function applyFieldMetadata({ field, data }: { field: Field; data: FieldJson }): Field {
  field.label = data.label;
  if (TextType.isInstanceOf(field.type)) {
    if (data.spec) field.type.spec = data.spec;
    if (data.subType) field.type.subType = data.subType;
  }
  if (DateType.isInstanceOf(field.type)) field.type.isDay = !!data.isDay;
  if (data.options && ChoiceType.isInstanceOf(field.type)) {
    for (const option of data.options) field.type.addOption(option.value, option.label, option.index);
  }
  return field;
}

export function deserializeField({
  schema,
  data,
  name = data.name
}: {
  schema: Schema;
  data: FieldJson;
  name?: string;
}): Field {
  const type =
    data.type === 'query'
      ? new QueryType(schema.getType(data.object))
      : data.type === 'array'
        ? new ArrayType(schema.getType(data.object))
        : schema.getType(data.type);
  const field =
    data.required != null || data.provideValue != null ? schema.param(name, type) : schema.field(name, type);
  if (field instanceof Param) {
    if (data.required != null) field.required = data.required;
    if (data.provideValue != null) field.provideValue = parseParameterValueProvider(data.provideValue);
  }
  if (data.relationship) {
    field.relationship = data.relationship;
    field.isRelationshipId = data.isRelationshipId;
  }
  return applyFieldMetadata({ field, data });
}

/**
 * Reconstruct the resolved model graph from the existing runtime wire format.
 */
export function deserializeSchema({
  data,
  schema = new Schema()
}: {
  data: ReturnType<typeof serializeSchema>;
  schema?: Schema;
}): Schema {
  const models = Object.entries(data.objects).map(([name, model]) => {
    const result = schema.newObjectType(name);
    result.label = model.label;
    result.displayFormat = SchemaObjectDisplayExpression.parse(model.display);
    return result;
  });
  schema.objects = Object.fromEntries(models.map((model) => [model.name, model]));
  for (const [name, model] of Object.entries(data.objects)) {
    const target = schema.objects[name];
    const fields = Object.entries(model.attributes).map(([name, field]) =>
      deserializeField({ schema, name, data: field })
    );
    for (const field of fields) target.addAttribute(field);
    for (const [name, relationship] of Object.entries(model.belongsTo)) {
      target.addBelongsTo({ schema, name, type: relationship.type, foreignName: relationship.foreignName });
    }
  }
  return schema;
}
