import { describe, expect, it } from 'vitest';
import { numberType, integerType, booleanType, textType } from '../src';

describe('scalar values', () => {
  it.each([
    [1000, 1000],
    ['1e3', 1000],
    [' 045 ', 45],
    ['-1.5', -1.5],
    ['0x10', 16]
  ])('parses finite number %j', (input, expected) => {
    expect(numberType.parse(input)).toBe(expected);
    expect(numberType.is(input)).toBe(typeof input === 'number');
  });

  it.each(['', ' ', '45px', 'true', 'null', 'NaN', 'Infinity', '1e999', null, undefined, true, {}, [], NaN, Infinity])(
    'rejects invalid numeric value %j',
    (value) => {
      expect(() => numberType.parse(value)).toThrow(SyntaxError);
    }
  );

  it('floors integer conversions while distinguishing integers from fractional values', () => {
    expect(integerType.parse('2.9')).toBe(2);
    expect(integerType.parse(-2.1)).toBe(-3);
    expect(integerType.is(2)).toBe(true);
    expect(integerType.is(2.9)).toBe(false);
    expect(integerType.is('2')).toBe(false);
    expect(() => integerType.parse('invalid')).toThrow(SyntaxError);
  });

  it.each([
    [true, true],
    [false, false],
    ['true', true],
    ['false', false],
    ['0', false],
    [1, true],
    [-1, true],
    [' 2 ', true]
  ])('parses boolean %j', (input, expected) => {
    expect(booleanType.parse(input)).toBe(expected);
    expect(booleanType.is(input)).toBe(typeof input === 'boolean');
  });

  it.each(['', 'null', 'yes', 'true false', 'Infinity', null, undefined, {}, [], NaN, Infinity])(
    'rejects invalid boolean %j',
    (value) => expect(() => booleanType.parse(value)).toThrow(SyntaxError)
  );

  it('converts values to text without treating nullish values as literal words', () => {
    expect(textType.parse(45)).toBe('45');
    expect(textType.parse(false)).toBe('false');
    expect(textType.parse(null)).toBe('');
    expect(textType.parse(undefined)).toBe('');
    expect(textType.parse('  hello  ')).toBe('  hello  ');
    expect(textType.is('hello')).toBe(true);
    expect(textType.is(45)).toBe(false);
  });
});
