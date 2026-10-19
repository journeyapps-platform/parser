import { ComponentSize } from './V5Attribute';

/**
 * Normalize a scalar declaration to all supported size variants.
 */
export function fanDefaultValue<T>(defaultValue: T): { [k in ComponentSize]: T } {
  return {
    [ComponentSize.SMALL]: defaultValue,
    [ComponentSize.MEDIUM]: defaultValue,
    [ComponentSize.LARGE]: defaultValue
  };
}
