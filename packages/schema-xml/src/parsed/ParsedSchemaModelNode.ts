import { sourceElement } from './sourceElement';
import { ParsedNode } from '@ja-platform/parser-core';
import { XmlSchema as Schema } from '../XmlSchema';
import { IndexDatabase } from '@ja-platform/parser-schema';
import { XmlModel as SchemaModelType } from '../XmlModel';
import { QueryType } from '@ja-platform/parser-schema';
import type { SchemaModelShape } from '../nodes/SchemaModelNode';

export class ParsedSchemaModelNode extends ParsedNode<SchemaModelShape> {
  toModel(schema: Schema): SchemaModelType {
    const model = schema.newObjectType(this.attrExpression('name').value());
    model.label = this.attrExpression('label').value();
    model.sourceElement = sourceElement(this);
    model.parsedNode = this;
    const fields = this.node('fields')
      .nodes()
      .map((field) => field.toField(schema));
    for (const field of fields) model.addAttribute(field);

    const display = this.node<SchemaModelShape['display']>('display');
    model.displayFormat = display?.attrExpression('format') ?? null;
    model.displaySource = sourceElement(display);
    model.allIndexes = this.node('indexes')
      .nodes()
      .map((index) => {
        const expression = index.attrExpression('keys');
        const keys = [...expression.keys];
        return {
          name: index.attrExpression('name')?.value() ?? keys.map((key) => key.field).join('_'),
          on: expression.items.map((item) => item.raw()),
          keys,
          databases: [
            ...(index.attrExpression('databases')?.databases ?? index.attribute('databases').definition.defaultValue)
          ]
        };
      });
    model.indexes = model.allIndexes.filter((index) => index.databases.includes(IndexDatabase.APP));
    model.notifyUsers = this.node('notifications')
      .nodes()
      .map((notification) => ({
        message: notification.attrExpression('message'),
        recipient: notification.attrExpression('recipient').value(),
        received: notification.attrExpression('received').value(),
        badgeCount: notification.attrExpression('badgeCount')?.value() ?? null
      }));
    model.webhooks = this.node('webhooks')
      .nodes()
      .map((webhook) => {
        const type = webhook.attrExpression('type').value();
        const receiver = webhook.attrExpression('receiver')?.value() ?? null;
        const action = webhook.attrExpression('action')?.value() ?? null;
        return {
          name:
            webhook.attrExpression('name')?.value() ??
            (receiver ? `${receiver}_${model.name}_${type}_${action}` : `${model.name}_${type}`),
          type,
          receiver,
          action,
          sourceElement: sourceElement(webhook),
          fields: webhook
            .node('fields')
            .nodes()
            .map((field) => ({
              name: field.attrExpression('name').value(),
              required:
                field.attrExpression('required')?.value() ?? field.attribute('required').definition.defaultValue,
              embed: field.attrExpression('embed')?.value() ?? field.attribute('embed').definition.defaultValue,
              state: field.attrExpression('state')?.value() ?? field.attribute('state').definition.defaultValue
            }))
        };
      });
    return model;
  }

  resolveBelongsTo({ schema, model }: { schema: Schema; model: SchemaModelType }): void {
    for (const declaration of this.node('belongsTo').nodes()) {
      const type = declaration.attrExpression('model').value();
      const name = declaration.attrExpression('name')?.value() ?? type;
      model.addBelongsTo({ schema, name, type });
      model.belongsToVars[name].sourceElement = sourceElement(declaration);
    }
  }

  resolveHasMany({ schema, model }: { schema: Schema; model: SchemaModelType }): void {
    for (const declaration of this.node('hasMany').nodes()) {
      const typeName = declaration.attrExpression('model').value();
      const target = schema.objects[typeName];
      if (!target) throw new Error(`Model '${typeName}' is not defined`);
      const name = declaration.attrExpression('name').value();
      const inverse = declaration.attrExpression('inverseOf')?.value();
      const candidates =
        inverse == null
          ? Object.values(target.belongsTo).filter((relationship) => relationship.foreignType === model)
          : [target.belongsTo[inverse]].filter((relationship) => relationship?.foreignType === model);
      if (candidates.length !== 1) {
        throw new Error(`Cannot resolve relationship '${model.name}.${name}' to a single belongs-to on '${typeName}'`);
      }
      const relationship = candidates[0];
      if (relationship.foreignName != null || Object.hasOwn(model.hasMany, name)) {
        throw new Error(`Relationship '${model.name}.${name}' is already linked`);
      }
      relationship.foreignName = name;
      model.hasMany[name] = relationship;
      const variable = schema.field(name, new QueryType(target));
      variable.sourceElement = sourceElement(declaration);
      model.hasManyVars[name] = variable;
    }
  }
}
