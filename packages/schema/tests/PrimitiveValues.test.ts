import { expect, it } from 'vitest';
import { Day } from '../src/day/Day';
import { DateType, SingleChoiceIntegerType, MultipleChoiceIntegerType } from '../src';

it('validates integer choices against declared options and converts enum options', () => {
  const single = new SingleChoiceIntegerType();
  single.setOptionLabels(['First', 'Second']);
  expect(single.parse(single.options[1])).toBe(1);
  expect(single.is(1)).toBe(true);
  expect(single.is(2)).toBe(false);
  expect(() => single.parse(2)).toThrow('not a valid enum value');
  const multiple = new MultipleChoiceIntegerType();
  multiple.setOptionLabels(['First', 'Second']);
  const selected = [1, 0];
  expect(multiple.parse(selected)).toEqual([1, 0]);
  expect(multiple.format(selected)).toBe('First, Second');
  expect(selected).toEqual([1, 0]);
  expect(multiple.is([2])).toBe(false);
  expect(() => multiple.parse([2])).toThrow('not a valid option');
  expect(() => multiple.parse(1)).toThrow('not an array');
});

it('converts Date and Day values according to the schema date mode', () => {
  const type = new DateType();
  const day = new Day('2026-01-02');
  expect(type.parse(day)).toEqual(day.toDate());
  expect(type.is(day)).toBe(false);
  expect(type.is(day.toDate())).toBe(true);
  type.isDay = true;
  const localDate = new Date(2026, 0, 2, 18);
  expect(type.parse(localDate).toString()).toBe('2026-01-02');
  expect(type.parse(day)).toBe(day);
  expect(type.is(localDate)).toBe(false);
  expect(type.format(day, 'YYYY-MM-DD')).toBe('2026-01-02');
  expect(() => type.parse('2026-01-02')).toThrow('not a Day');
});
