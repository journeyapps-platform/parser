import { XmlSchema as Schema } from '../src';
import { deserializeSchema, serializeSchema } from '@ja-platform/parser-schema-json';
import { loadSchemaXml } from '../src';
import { prettyText, parse } from '@journeyapps/common-xml';

import { SchemaObjectDisplayExpression } from '@ja-platform/parser-schema';
import { toDOM } from '../src';
import { describe, it, expect } from 'vitest';

// @ts-ignore
import schema3_xml from './fixtures/schema3.xml?raw';
// @ts-ignore
import expectedOutput from './fixtures/schema_modified.xml?raw';

describe('Schema toDOM', () => {
  it('should output a modified schema', () => {
    const schema = loadSchemaXml({ source: schema3_xml });

    const originalDoc = parse(schema3_xml);
    const originalPretty = prettyText(originalDoc);
    const outputText = prettyText(toDOM(schema));

    // Unchanged input should give unchanged output.
    expect(outputText).toEqual(originalPretty);

    // JSON must carry the same display source as XML, including its placeholders.
    const restored = new Schema();
    deserializeSchema({ schema: restored, data: JSON.parse(JSON.stringify(serializeSchema(schema))) });
    expect(restored.objects.room.displayFormat.raw()).toBe('{barcode} {name} ({building.name})');

    // START MODIFICATIONS

    // Add fields
    schema.objects.building.addAttribute(schema.field('floors', schema.primitive('number')));
    schema.objects.building.addAttribute(schema.field('height', schema.primitive('number')));
    schema.objects.building.attributes.height.label = 'Height';

    // Delete model
    delete schema.objects.branch;

    // Change label
    schema.objects.worker.attributes.name.label = 'Full Name';

    // Change display
    schema.objects.building.displayFormat = SchemaObjectDisplayExpression.parse('Updated');

    // Delete field
    delete schema.objects.room.attributes.name;

    // END MODIFICATIONS

    const modifiedText = prettyText(toDOM(schema));
    expect(modifiedText).toEqual(expectedOutput);
  });
});
