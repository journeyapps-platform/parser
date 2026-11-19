import { BooleanType } from '@ja-platform/parser-type-system';

/**
 * Convert resolved conditions, including the presence of objects and non-boolean fields.
 * Literal boolean syntax is validated separately by BooleanType.
 */
export class ConditionType extends BooleanType {
  readonly _typeName = 'condition';
  readonly name = 'condition';

  parse(value: unknown): boolean {
    if (
      typeof value === 'boolean' ||
      typeof value === 'number' ||
      (typeof value === 'string' &&
        (['true', 'false'].includes(value.trim()) || (value.trim() !== '' && Number.isFinite(Number(value)))))
    ) {
      return super.parse(value);
    }
    return !!value;
  }
}
