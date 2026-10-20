import { XmlSchema as Schema } from '../src';
import { loadSchemaXml } from '../src';

import { SchemaModelType, SchemaObjectDisplayExpression, TextType } from '@ja-platform/parser-schema';
import { SchemaFieldNode } from '../src/nodes/SchemaFieldNode';
import { SchemaModelNode } from '../src/nodes/SchemaModelNode';
import { describe, it, expect } from 'vitest';
import * as blackmontapp_xml from '@journeyapps/common-xml';

// @ts-ignore
import schema3_xml from './fixtures/schema3.xml?raw';
// @ts-ignore
import schema3BadgeCountXml from './fixtures/schema3-badge-count.xml?raw';

describe('xml schema parsing (domparser)', () => {
  function xml(text: string) {
    return blackmontapp_xml.parse(text).documentElement;
  }

  function parseField(element: ReturnType<typeof xml>) {
    return new SchemaFieldNode()
      .parseTree({ event: { element, helper: { pushError: () => {} } } })
      .toField(new Schema());
  }

  function parseModel(element: ReturnType<typeof xml>) {
    return new SchemaModelNode()
      .parseTree({ event: { element, helper: { pushError: () => {} } } })
      .toModel(new Schema());
  }

  it('should load a text attribute', () => {
    const attr = parseField(xml('<field name="serial_number" label="Serial Number" type="text:name" />'));
    expect(attr.name).toBe('serial_number');
    expect(attr.label).toBe('Serial Number');
    expect(attr.type.name).toEqual('text');
    expect(attr.type.spec).toEqual('text.name');
    expect(attr.type.subType).toEqual('name');
  });

  it('should load an enum attribute', () => {
    const attr = parseField(
      xml(
        '<field name="colours" label="Colours" type="single-choice-integer">' +
          '<option>Red</option>' +
          '<option>Green</option>' +
          '<option>Blue</option>' +
          '<option>Black</option>' +
          '<option>Yellow</option>' +
          '<option>Purple</option>' +
          '<option>Brown</option>' +
          '<option>Pink</option>' +
          '<option>Grey</option>' +
          '<option>White</option>' +
          '<option>Magenta</option>' +
          '</field>'
      )
    );
    expect(attr.type.name).toEqual('single-choice-integer');
    expect(attr.type.hasOptions).toBe(true);
    expect(attr.type.multipleOptions).toBe(false);
    expect(Object.keys(attr.type.options).length).toEqual(11);
    expect(attr.type.options[0].label).toEqual('Red');
    expect(attr.type.options[0].index).toEqual(0);
    expect(attr.type.options[1].label).toEqual('Green');
    expect(attr.type.options[1].index).toEqual(1);
    expect(attr.type.options[2].label).toEqual('Blue');
    expect(attr.type.options[2].index).toEqual(2);
    expect(attr.type.options[9].label).toEqual('White');
    expect(attr.type.options[9].index).toEqual(9);
    expect(attr.type.options[10].label).toEqual('Magenta');
    expect(attr.type.options[10].index).toEqual(10);

    // Confirm ordering
    expect(Object.keys(attr.type.options)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  });

  it('should load a single-choice attribute', () => {
    const attr = parseField(
      xml(
        '<field name="colours" label="Colours" type="single-choice">' +
          '<option key="red">Red</option>' +
          '<option key="green">Green</option>' +
          '<option key="blue">Blue</option>' +
          '<option key="black">Black</option>' +
          '<option key="yellow">Yellow</option>' +
          '<option key="purple">Purple</option>' +
          '<option key="brown">Brown</option>' +
          '<option key="pink">Pink</option>' +
          '<option key="grey">Grey</option>' +
          '<option key="white">White</option>' +
          '<option key="magenta">Magenta</option>' +
          '</field>'
      )
    );
    expect(attr.type.name).toEqual('single-choice');
    expect(attr.type.hasOptions).toBe(true);
    expect(attr.type.multipleOptions).toBe(false);
    expect(Object.keys(attr.type.options).length).toEqual(11);
    expect(attr.type.options.red.label).toEqual('Red');
    expect(attr.type.options.red.index).toEqual(0);
    expect(attr.type.options.green.label).toEqual('Green');
    expect(attr.type.options.green.index).toEqual(1);
    expect(attr.type.options.blue.label).toEqual('Blue');
    expect(attr.type.options.blue.index).toEqual(2);

    // Confirm ordering
    expect(Object.keys(attr.type.options)).toEqual([
      'red',
      'green',
      'blue',
      'black',
      'yellow',
      'purple',
      'brown',
      'pink',
      'grey',
      'white',
      'magenta'
    ]);

    expect(attr.type.toJSON().options).toEqual([
      { value: 'red', label: 'Red', index: 0 },
      { value: 'green', label: 'Green', index: 1 },
      { value: 'blue', label: 'Blue', index: 2 },
      { value: 'black', label: 'Black', index: 3 },
      { value: 'yellow', label: 'Yellow', index: 4 },
      { value: 'purple', label: 'Purple', index: 5 },
      { value: 'brown', label: 'Brown', index: 6 },
      { value: 'pink', label: 'Pink', index: 7 },
      { value: 'grey', label: 'Grey', index: 8 },
      { value: 'white', label: 'White', index: 9 },
      { value: 'magenta', label: 'Magenta', index: 10 }
    ]);
  });

  it('should load a boolean attribute', () => {
    const attr = parseField(
      xml(
        '<field name="confirm" label="Confirm" type="boolean">' +
          '<option key="true">OK</option>' +
          '<option key="false">Cancel</option>' +
          '</field>'
      )
    );
    expect(attr.type.name).toEqual('boolean');
    expect(attr.type.hasOptions).toBe(true);
    expect(attr.type.multipleOptions).toBe(false);
    expect(Object.keys(attr.type.options)).toEqual(['true', 'false']);
    expect(attr.type.options['true'].label).toEqual('OK');
    expect(attr.type.options['true'].value).toEqual(true);
    expect(attr.type.options['true'].index).toEqual(0);
    expect(attr.type.options['false'].label).toEqual('Cancel');
    expect(attr.type.options['false'].value).toEqual(false);
    expect(attr.type.options['false'].index).toEqual(1);
  });

  it('should load a boolean attribute with defaults', () => {
    const attr = parseField(xml('<field name="confirm" label="Confirm" type="boolean"/>'));
    expect(attr.type.name).toEqual('boolean');
    expect(attr.type.hasOptions).toBe(true);
    expect(attr.type.multipleOptions).toBe(false);
    expect(Object.keys(attr.type.options)).toEqual(['false', 'true']);
    expect(attr.type.options['true'].label).toEqual('Yes');
    expect(attr.type.options['true'].index).toEqual(1);
    expect(attr.type.options['false'].label).toEqual('No');
    expect(attr.type.options['false'].index).toEqual(0); // false defaults to first element
  });

  it('should load a multiple-choice attribute', () => {
    const attr = parseField(
      xml(
        '<field name="colours" label="Colours" type="multiple-choice">' +
          '<option key="red">Red</option>' +
          '<option key="green">Green</option>' +
          '<option key="blue">Blue</option>' +
          '</field>'
      )
    );
    expect(attr.type.name).toEqual('multiple-choice');
    expect(attr.type.hasOptions).toBe(true);
    expect(attr.type.multipleOptions).toBe(true);
    expect(Object.keys(attr.type.options).length).toEqual(3);
    expect(attr.type.options.red.label).toEqual('Red');
    expect(attr.type.options.red.index).toEqual(0);
    expect(attr.type.options.green.label).toEqual('Green');
    expect(attr.type.options.green.index).toEqual(1);
    expect(attr.type.options.blue.label).toEqual('Blue');
    expect(attr.type.options.blue.index).toEqual(2);
  });

  it('should load a multiple-choice-integer attribute', () => {
    const attr = parseField(
      xml(
        '<field name="colours" label="Colours" type="multiple-choice-integer">' +
          '<option key="1">Red</option>' +
          '<option key="3">Green</option>' +
          '<option>Blue</option>' +
          '</field>'
      )
    );
    expect(attr.type.name).toEqual('multiple-choice-integer');
    expect(attr.type.hasOptions).toBe(true);
    expect(attr.type.multipleOptions).toBe(true);
    expect(Object.keys(attr.type.options).length).toEqual(3);
    expect(attr.type.options[1].label).toEqual('Red');
    expect(attr.type.options[1].index).toEqual(0);
    expect(attr.type.options[3].label).toEqual('Green');
    expect(attr.type.options[3].index).toEqual(1);
    expect(attr.type.options[4].label).toEqual('Blue');
    expect(attr.type.options[4].index).toEqual(2);
  });

  it('should load an object', () => {
    const assetType = parseModel(
      xml(
        '<model name="asset" label="Asset">' +
          '<field name="serial_number" label="Serial Number" type="text" />' +
          '<display format="{make} {model} [{serial_number}]" />' +
          '</model>'
      )
    );

    expect(assetType.name).toBe('asset');
    expect(assetType.label).toBe('Asset');

    const serial = assetType.getAttribute('serial_number');
    expect(serial).not.toEqual(null);
    expect(serial.name).toEqual('serial_number');
    expect(serial.label).toEqual('Serial Number');
    expect(TextType.isInstanceOf(serial.type)).toBe(true);
  });

  it('should load a schema from an xml string', () => {
    const s = loadSchemaXml({ source: schema3_xml });

    expect(s.errors).toEqual([]);

    const assetType = s.getType('asset');
    expect(assetType).not.toEqual(null);
    expect(assetType.label).toBe('Asset');

    expect(assetType.indexes).toEqual([
      { on: ['worker'], name: 'owner', databases: ['app', 'cloud'], keys: [{ field: 'worker', dir: 1 }] },
      {
        on: ['make', 'model'],
        name: 'make_model',
        databases: ['app', 'cloud'],
        keys: [
          { field: 'make', dir: 1 },
          { field: 'model', dir: 1 }
        ]
      }
    ]);

    const roomType = s.getType('room');
    expect(roomType).not.toEqual(null);

    const rel = assetType.belongsTo.room;
    expect(rel).not.toEqual(null);
    expect(rel.name).toEqual('room');
    expect(rel.objectType).toEqual(assetType);
    expect(rel.foreignType).toEqual(roomType);
    expect(rel.foreignName).toEqual('assets');
    expect(rel.type).toEqual('one-to-many');

    expect(roomType.hasMany.assets).toBe(rel);

    const roomAttr = assetType.getAttribute('room');
    expect(roomAttr.name).toBe('room');
    expect(roomAttr.type.name).toBe('room');
    expect(roomAttr.relationship).toBe('room');

    const roomIdAttr = assetType.getAttribute('room_id');
    expect(roomIdAttr.name).toBe('room_id');
    expect(roomIdAttr.type.name).toBe('text');
    expect(roomIdAttr.relationship).toBe('room');

    const assetsAttr = roomType.getAttribute('assets');
    expect(assetsAttr.name).toBe('assets');
    expect(assetsAttr.type.name).toBe('query');
    expect(assetsAttr.type.itemType.name).toBe('asset');

    const photoAttr = assetType.getAttribute('photo');
    expect(photoAttr.type.media).toBe('image/jpeg');
    expect(photoAttr.type.autoDownload).toBe(true);

    const signatureAttr = assetType.getAttribute('tnc_signature');
    expect(signatureAttr.type.media).toBe('image/svg+xml');
    expect(signatureAttr.type.autoDownload).toBe(false);

    const attributeKeys = Object.keys(roomType.getAttributes()).sort();
    expect(attributeKeys).toEqual([
      'assets',
      'barcode',
      'building',
      'building_id',
      'id',
      'name',
      'personnel',
      'personnel_id'
    ]);

    const barcodeAttr = assetType.getAttribute('barcode');
    expect(barcodeAttr.type.spec).toBe('text.email');
  });

  it('should load a notify-user definition for a model', () => {
    const s = loadSchemaXml({ source: schema3_xml });

    expect(s.errors).toEqual([]);

    const workerType = s.getType('worker');
    expect(workerType).not.toEqual(null); // sanity check

    const notification = s.getType('order_notification');
    expect(notification).not.toEqual(null); // sanity check
    expect(notification.notifyUsers).not.toEqual(null);
    expect(notification.notifyUsers.length).toEqual(1);
    expect(notification.notifyUsers[0].message).toBeInstanceOf(SchemaObjectDisplayExpression);
    expect(notification.notifyUsers[0].received).toEqual('received_at');
    expect(notification.notifyUsers[0].recipient).toEqual('worker');
    expect(notification.notifyUsers[0].badgeCount).toEqual(null);

    const executableMessage = schema3_xml.replace('message="{message}"', 'message="{$:loadMessage()}"');
    expect(loadSchemaXml({ source: executableMessage }).errors.length).toBeGreaterThan(0);
  });

  it('should a notify-user definition for a model with badge count', () => {
    const s = loadSchemaXml({ source: schema3BadgeCountXml });

    expect(s.errors).toEqual([]);

    const workerType = s.getType('worker') as SchemaModelType;
    expect(workerType).not.toEqual(null); // sanity check

    const notification = s.getType('order_notification') as SchemaModelType;
    expect(notification).not.toEqual(null); // sanity check
    expect(notification.notifyUsers).not.toEqual(null);
    expect(notification.notifyUsers.length).toEqual(1);
    expect(notification.notifyUsers[0].message).not.toEqual(null);
    expect(notification.notifyUsers[0].received).toEqual('received_at');
    expect(notification.notifyUsers[0].recipient).toEqual('worker');
    expect(notification.notifyUsers[0].badgeCount).toEqual('badge_count');
  });

  it('should load a ready webhook definition for a model', () => {
    const s = loadSchemaXml({ source: schema3_xml });

    expect(s.errors).toEqual([]);

    const assetType = s.getType('asset') as SchemaModelType;
    expect(assetType).not.toEqual(null); // sanity check

    expect(assetType.webhooks).not.toEqual(null);
    expect(assetType.webhooks.length).toEqual(2);

    // first webhook for asset model
    let webhook = assetType.webhooks[0];
    expect(webhook).not.toEqual(null);
    expect(webhook.type).toEqual('ready');
    expect(webhook.name).toEqual('ready_asset');
    expect(webhook.fields).not.toEqual(null);
    expect(webhook.fields.length).toEqual(3);

    let webhookField = webhook.fields[0];
    expect(webhookField).not.toEqual(null);
    expect(webhookField.name).toEqual('room');
    expect(webhookField.embed).toEqual(true);
    expect(webhookField.required).toEqual(true); // default value

    webhookField = webhook.fields[1];
    expect(webhookField).not.toEqual(null);
    expect(webhookField.name).toEqual('photo');
    expect(webhookField.embed).toEqual(true); // default value
    expect(webhookField.required).toEqual(false);
    expect(webhookField.state).toEqual('present'); // default value

    webhookField = webhook.fields[2];
    expect(webhookField).not.toEqual(null);
    expect(webhookField.name).toEqual('tnc_signature');
    expect(webhookField.embed).toEqual(false);
    expect(webhookField.required).toEqual(true);
    expect(webhookField.state).toEqual('uploaded');

    // second webhook for asset model
    webhook = assetType.webhooks[1];
    expect(webhook).not.toEqual(null);
    expect(webhook.type).toEqual('ready');
    expect(webhook.name).toEqual('ready_asset2');

    expect(webhook.fields).not.toEqual(null);
    expect(webhook.fields.length).toEqual(0);
  });

  it('should load an update webhook definition for a model', () => {
    const s = loadSchemaXml({ source: schema3_xml });

    expect(s.errors).toEqual([]);

    const roomType = s.getType('room') as SchemaModelType;
    expect(roomType).not.toEqual(null); // sanity check

    expect(roomType.webhooks).not.toEqual(null);
    expect(roomType.webhooks.length).toEqual(1);

    const webhook = roomType.webhooks[0];
    expect(webhook).not.toEqual(null);
    expect(webhook.type).toEqual('update');
    expect(webhook.name).toEqual('update_room');

    expect(webhook.fields).not.toEqual(null);
    expect(webhook.fields.length).toEqual(0);
  });

  it('should load a webhook with an explicit receiver', () => {
    const s = loadSchemaXml({ source: schema3_xml });
    expect(s.errors).toEqual([]);

    const part = s.getType('part') as SchemaModelType;
    expect(part).not.toEqual(null); // sanity check

    expect(part.webhooks).not.toEqual(null);
    expect(part.webhooks.length).toEqual(4);

    expect(part.webhooks[0].name).toEqual('cloudcode_part_ready_helloworld');
    expect(part.webhooks[1].name).toEqual('pdfmailer_part_update_helloworld');
    expect(part.webhooks[2].name).toEqual('cloudcode_part_update_helloworld');
    expect(part.webhooks[3].name).toEqual('overridden_name');
  });
});
