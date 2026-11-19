import { ParsedAttribute } from '../parsed/ParsedAttribute';
import { AbstractValueProvider } from './AbstractValueProvider';
import { ParsedProviderValue } from './ParsedProviderValue';

/**
 * Resolve declared defaults as literal values, including null and falsy values.
 */
export class ParserDefaultValueProvider extends AbstractValueProvider {
  protected createProviderValue<T>(attribute: ParsedAttribute): ParsedProviderValue<T> {
    const value = attribute.definition.options.defaultValue;
    return new ParsedProviderValue<T>({ value, active: value !== undefined, provider: this });
  }
}
