import { xmlInput } from './xmlInput';
import { serializeSchema, deserializeSchema } from '@ja-platform/parser-schema-json';
import { expect, it } from 'vitest';
import { parse, prettyText } from '@journeyapps/common-xml';
import { DOMParser } from '@journeyapps/domparser';
import { loadSchemaXml } from '../src/loadSchemaXml';
import {
  ConstantExpressionValueProvider,
  ParserDefaultValueProvider,
  ParsedDiagnostic
} from '@ja-platform/parser-core';
import { SchemaNode } from '../src/SchemaNode';
import { IndexDirection } from '@ja-platform/parser-schema';
import { QueryType } from '@ja-platform/parser-schema';
import { toDOM } from '../src/schemaSerializer';
// @ts-ignore
import schemaXml from './fixtures/schema3.xml?raw';
// @ts-ignore
import notificationsXml from './fixtures/schema3-badge-count.xml?raw';

it('reports invalid choice keys at the XML attribute and skips schema conversion', () => {
  const source = `<data-model><model name="item" label="Item">
    <field name="status" label="Status" type="single-choice-integer">
      <option key="invalid">Ready</option>
    </field><display>Item</display>
  </model></data-model>`;
  const schema = loadSchemaXml({ source });
  expect(schema.errors).toHaveLength(1);
  const model = schema.parsedNode.node('models').nodes()[0];
  const field = model.node('fields').nodes()[0];
  const attribute = field.node('options').nodes()[0].attribute('key');
  expect(schema.errors[0]).toBe(attribute.errors()[0]);
  expect(schema.errors[0].source).toBe(attribute.input.source);
  const { start, end } = schema.errors[0].source.range;
  expect(source.slice(start, end)).toContain('invalid');
  expect(schema.errors[0].message).toBeTruthy();
  expect(schema.parsedNode).toBeDefined();
  expect(schema.objects).toEqual({});
});

it('retains character offsets for XML syntax errors', () => {
  const source = '<data-model>\n  <model name="item"></wrong>\n</data-model>';
  const schema = loadSchemaXml({ source });
  const original = new DOMParser().parseFromString(source, 'text/xml').errors;
  expect(schema.errors.length).toBeGreaterThan(0);
  expect(schema.errors.map((diagnostic) => diagnostic.source.range)).toEqual(
    original.map((error) => ({ start: error.startOffset, end: error.endOffset ?? error.startOffset }))
  );
  expect(schema.parsedNode).toBeUndefined();
});

it('locates an unexpected root using a source reference', () => {
  const source = '<wrong />';
  const schema = loadSchemaXml({ source });
  expect(schema.errors).toHaveLength(1);
  expect(schema.errors[0].message).toBe('<data-model> root tag expected');
  const { start, end } = schema.errors[0].source.range;
  expect(source.slice(start, end)).toContain('wrong');
});

it.each([schemaXml, notificationsXml])('parses existing schema XML into typed declarations %#', (source) => {
  const diagnostics: ParsedDiagnostic[] = [];
  const parsed = new SchemaNode().parseTree({
    ...xmlInput(source),
    report: (error) => diagnostics.push(error)
  });
  parsed.setValueProviders([new ParserDefaultValueProvider(), new ConstantExpressionValueProvider()]);
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
  const parsed = new SchemaNode().parseTree({
    ...xmlInput(`<data-model><model name="item" label="Item">
      <field name="status" label="Status" type="single-choice-integer"><option key="4">Ready</option></field>
      <field name="enabled" label="Enabled" type="boolean"><option key="false">Disabled</option></field>
      <field name="file" label="File" type="attachment" media="application/pdf" auto-download="true"/>
      <index on="-status, +enabled" database="app, cloud"/><display>{status}</display>
    </model></data-model>`),
    report: (error) => diagnostics.push(error)
  });
  parsed.setValueProviders([new ParserDefaultValueProvider(), new ConstantExpressionValueProvider()]);
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
  const definition = new SchemaNode();
  const parsed = definition.parseTree({
    ...xmlInput(source),
    report: () => {}
  });
  const schema = parsed.toSchema();
  expect(schema.objects.person.hasMany.articles).toBe(schema.objects.article.belongsTo.author);
  expect(schema.objects.article.belongsTo.reviewer.foreignName).toBeNull();

  const ambiguous = definition.parseTree({
    ...xmlInput(source.replace(' inverse-of="author"', '')),
    report: () => {}
  });
  expect(() => ambiguous.toSchema()).toThrow('Cannot resolve relationship');
});
