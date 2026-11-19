import type { Formatter } from '@ja-platform/parser-type-system';

/**
 * Format an expression with a specific format.
 */
export function formatValue(value: any, formatter: Formatter | null, format?: string | null): string {
  if (value == null) {
    return '';
  } else if (formatter?.format != null) {
    return formatter.format(value, format ?? undefined);
  } else {
    // This should generally not happen. However, we still try to handle it gracefully.
    // This is useful for tests where we don't want to define the type for every variable.
    return value.toString();
  }
}

/**
 * Resolve an object's asynchronous display value before falling back to its type formatter.
 */
export async function formatValueAsync(
  value: any,
  formatter: Formatter | null,
  format?: string | null
): Promise<string> {
  let formatted: string;
  if (value != null && typeof value._display === 'function') {
    formatted = await value._display();
  } else {
    formatted = formatValue(value, formatter, format);
  }
  return formatted;
}
