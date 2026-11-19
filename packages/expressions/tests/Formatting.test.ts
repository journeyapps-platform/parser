import { expect, it } from 'vitest';
import { formatValue, formatValueAsync } from '../src';

it('formats nulls, custom types, and untyped values', () => {
  const formatter = { format: (value: unknown, format?: string) => `${format}:${value}` };
  expect(formatValue(null, formatter)).toBe('');
  expect(formatValue(42, formatter, 'units')).toBe('units:42');
  expect(formatValue(42, null)).toBe('42');
});

it('prefers asynchronous object display and propagates display failures', async () => {
  const formatter = { format: () => 'fallback' };
  expect(await formatValueAsync({ _display: async () => 'Asset' }, formatter)).toBe('Asset');
  expect(await formatValueAsync(42, formatter)).toBe('fallback');
  const failure = new Error('display failed');
  await expect(
    formatValueAsync(
      {
        _display: async () => {
          throw failure;
        }
      },
      formatter
    )
  ).rejects.toBe(failure);
});
