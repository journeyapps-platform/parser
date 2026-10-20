import { serializeSchema, deserializeSchema } from '@ja-platform/parser-schema-json';
import { expect, it } from 'vitest';
import { parse, prettyText } from '@journeyapps/common-xml';
import {
  ConstantExpressionValueProvider,
  ParserDefaultValueProvider,
  ParsedDiagnostic
} from '@ja-platform/parser-core';
import { SchemaDefinition } from '../src/SchemaDefinition';
import { IndexDirection } from '@ja-platform/parser-schema';
import { QueryType } from '@ja-platform/parser-schema';
import { toDOM } from '../src/schemaSerializer';
// @ts-ignore
import schemaXml from './fixtures/schema3.xml?raw';
// @ts-ignore
import notificationsXml from './fixtures/schema3-badge-count.xml?raw';

it.each([schemaXml, notificationsXml])('parses existing schema XML into typed declarations %#', (source) => {
  const diagnostics: ParsedDiagnostic[] = [];
  const parsed = new SchemaDefinition().parseTree({
    event: { element: parse(source).documentElement, helper: { pushError: (error) => diagnostics.push(error) } },
    valueProviders: [new ParserDefaultValueProvider(), new ConstantExpressionValueProvider()]
  });
  expect(diagnostics).toEqual([]);
  const asset = parsed
    .node('models')
    .nodes()
    .find((model) => model.attrExpression('name').value() === 'asset');
  const barcode = asset
    .node('fields')
    .nodes()
    .find((field) => field.attrExpression('name').value() === 'barcode');
  const schema = parsed.toSchema();
  expect(schema.parsedNode).toBe(parsed);
  expect(schema.objects.asset.parsedNode).toBe(asset);
  expect(schema.objects.asset.attributes.barcode.parsedNode).toBe(barcode);
  const restored = deserializeSchema({ data: JSON.parse(JSON.stringify(serializeSchema(schema))) });
  expect(restored).not.toHaveProperty('parsedNode');
  expect(restored.objects.asset).not.toHaveProperty('sourceElement');
  expect(restored.objects.asset.attributes.barcode).not.toHaveProperty('parsedNode');
  expect(serializeSchema(restored)).toEqual(serializeSchema(schema));
  for (const model of Object.values(schema.objects)) {
    for (const relationship of Object.values(model.belongsTo)) {
      expect(relationship.objectType).toBe(model);
      expect(relationship.foreignType).toBe(schema.objects[relationship.foreignType.name]);
      if (relationship.foreignName) {
        expect(relationship.foreignType.hasMany[relationship.foreignName]).toBe(relationship);
        const query = relationship.foreignType.hasManyVars[relationship.foreignName].type as QueryType;
        expect(query.itemType).toBe(model);
      }
    }
  }
  expect(prettyText(toDOM(schema))).toEqual(prettyText(parse(source)));
  const anotherSchema = parsed.toSchema();
  expect(anotherSchema.objects.asset).not.toBe(schema.objects.asset);
  expect(anotherSchema.objects.asset.belongsTo.room.foreignType).toBe(anotherSchema.objects.room);
});

it('retains typed choice keys, index directions and explicit database lists', () => {
  const diagnostics: ParsedDiagnostic[] = [];
  const parsed = new SchemaDefinition().parseTree({
    event: {
      element: parse(`<data-model><model name="item" label="Item">
      <field name="status" label="Status" type="single-choice-integer"><option key="4">Ready</option></field>
      <field name="enabled" label="Enabled" type="boolean"><option key="false">Disabled</option></field>
      <field name="file" label="File" type="attachment" media="application/pdf" auto-download="true"/>
      <index on="-status, +enabled" database="app, cloud"/><display>{status}</display>
    </model></data-model>`).documentElement,
      helper: { pushError: (error) => diagnostics.push(error) }
    },
    valueProviders: [new ParserDefaultValueProvider(), new ConstantExpressionValueProvider()]
  });
  expect(diagnostics).toEqual([]);
  const converted = parsed.toSchema().objects.item;
  expect(converted.attributes.status.type.toJSON()).toMatchObject({
    options: [{ value: 4, label: 'Ready', index: 0 }]
  });
  expect(converted.attributes.enabled.type.toJSON()).toMatchObject({
    options: [{ value: false, label: 'Disabled', index: 0 }]
  });
  expect(converted.attributes.file.type).toMatchObject({ media: 'application/pdf', autoDownload: true });
  expect(converted.allIndexes[0].keys).toEqual([
    { field: 'status', dir: IndexDirection.DESCENDING },
    { field: 'enabled', dir: IndexDirection.ASCENDING }
  ]);
});

it('links an explicit inverse and rejects ambiguous relationships during conversion', () => {
  const source = `<data-model>
    <model name="person" label="Person">
      <has-many name="articles" model="article" inverse-of="author"/><display>Person</display>
    </model>
    <model name="article" label="Article">
      <belongs-to name="author" model="person"/>
      <belongs-to name="reviewer" model="person"/><display>Article</display>
    </model>
  </data-model>`;
  const definition = new SchemaDefinition();
  const parsed = definition.parseTree({
    event: { element: parse(source).documentElement, helper: { pushError: () => {} } }
  });
  const schema = parsed.toSchema();
  expect(schema.objects.person.hasMany.articles).toBe(schema.objects.article.belongsTo.author);
  expect(schema.objects.article.belongsTo.reviewer.foreignName).toBeNull();

  const ambiguous = definition.parseTree({
    event: {
      element: parse(source.replace(' inverse-of="author"', '')).documentElement,
      helper: { pushError: () => {} }
    }
  });
  expect(() => ambiguous.toSchema()).toThrow('Cannot resolve relationship');
});
