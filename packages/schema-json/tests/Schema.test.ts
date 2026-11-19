import { describe, it, expect } from 'vitest';
import { Schema, SchemaModelType, Param, parseParameterValueProvider } from '@ja-platform/parser-schema';
import { ObjectType, Type as ValueType } from '@ja-platform/parser-type-system';
import { deserializeSchema, deserializeField, serializeField } from '../src';

describe('json parsing', () => {
  const schema = new Schema();
  it('should parse an object', () => {
    deserializeSchema({
      schema: schema,
      data: {
        objects: {
          asset: {
            label: 'Asset',
            display: 'something',
            attributes: {
              serial: {
                type: 'text',
                label: 'Serial Number',
                spec: 'number'
              },
              colours: {
                type: 'single-choice-integer',
                label: 'Colours',
                options: [
                  { value: 0, label: 'Red', index: 1 },
                  { value: 3, label: 'Green', index: 0 }
                ]
              }
            },
            belongsTo: {
              container: {
                type: 'room',
                foreignName: 'assets'
              }
            }
          },
          room: {
            label: 'Room',
            display: 'Something',
            attributes: {},
            belongsTo: {}
          }
        }
      }
    });

    const asset = schema.objects.asset;
    const room = schema.objects.room;

    expect(asset).toBeInstanceOf(ObjectType);
    expect(asset).toBeInstanceOf(ValueType);
    expect(asset.getField('serial')).toBe(asset.attributes.serial.type);
    expect(asset.getField('container')).toBe(room);
    expect(asset.getField('__proto__')).toBeNull();
    expect(asset.label).toBe('Asset');
    expect(asset.attributes.serial.type.spec).toBe('number');
    expect(asset.attributes.colours.type.options[3].label).toBe('Green');
    expect(asset.attributes.colours.type.options[0].index).toBe(1);
    expect(asset.attributes.colours.type.options[3].index).toBe(0);

    const rel = asset.belongsTo.container;
    expect(rel.objectType).toBe(asset);
    expect(rel.foreignType).toBe(room);
    expect(rel.foreignName).toEqual('assets');
    expect(rel.type).toEqual('one-to-many');

    expect(room.hasMany.assets).toBe(rel);
  });

  it('should parse a field', () => {
    const field = deserializeField({
      schema: schema,
      data: {
        name: 'serial_number',
        type: 'text',
        label: 'Serial Number',
        spec: 'number',
        subType: 'signed-number'
      }
    });

    expect(field.name).toBe('serial_number');
    expect(field.type.name).toBe('text');
    expect(field.type.spec).toBe('number');
    expect(field.type.subType).toBe('signed-number');

    // TODO: test options
  });

  it('should parse a date field', () => {
    let field = deserializeField({
      schema: schema,
      data: {
        name: 'day',
        type: 'date'
      }
    });

    expect(field.name).toBe('day');
    expect(field.type.name).toBe('date');
    expect(field.type.isDay).toBe(false);

    expect(serializeField(field)).toEqual({ name: 'day', type: 'date' });
  });

  it('should parse a date field (isDay: true)', () => {
    let field = deserializeField({
      schema: schema,
      data: {
        name: 'day',
        type: 'date',
        isDay: true
      }
    });

    expect(field.name).toBe('day');
    expect(field.type.name).toBe('date');
    expect(field.type.isDay).toBe(true);
    expect(serializeField(field)).toEqual({ name: 'day', type: 'date', isDay: true });
  });

  it('should parse a date field (isDay: false)', () => {
    let field = deserializeField({
      schema: schema,
      data: {
        name: 'day',
        type: 'date',
        isDay: false
      }
    });

    expect(field.name).toBe('day');
    expect(field.type.name).toBe('date');
    expect(field.type.isDay).toBe(false);
    expect(serializeField(field)).toEqual({ name: 'day', type: 'date' });
  });
});

it.each(['convert($event.value)', 'convert'])('keeps parameter provider %s parsed across serialization', (source) => {
  const schema = new Schema();
  const param = schema.param('input', schema.primitive('text'));
  param.provideValue = parseParameterValueProvider(`$:${source}`);
  const expectedCode = source === 'convert' ? 'convert()' : source;
  expect(param.provideValue.code()).toBe(expectedCode);

  // The wire format stays a string; the receiver restores the parsed expression.
  const serialized = serializeField(param);
  expect(serialized.provideValue).toBe(`$:${expectedCode}`);
  const restored = deserializeField({ schema: schema, name: param.name, data: serialized }) as Param;
  expect(restored.provideValue.code()).toBe(expectedCode);
});
