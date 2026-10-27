import { BaseObserver } from '@journeyapps/common-utils';
import type { ParsedAttribute } from '../parsed/ParsedAttribute';
import { ParsedProviderValue } from './ParsedProviderValue';

export interface ParsedValueProviderListener {
  dirty?: () => any;
}

export abstract class AbstractValueProvider extends BaseObserver<ParsedValueProviderListener> {
  private readonly providerValues = new Map<ParsedProviderValue<any>, ParsedAttribute>();

  constructor() {
    super();
  }

  dispose(): void {
    this.providerValues.forEach((attribute, value) => value.dispose());
    this.providerValues.clear();
  }

  value<T>(attribute: ParsedAttribute): ParsedProviderValue<T> {
    const providerValue = this.createProviderValue<T>(attribute);
    this.providerValues.set(providerValue, attribute);
    const deregister = providerValue.registerListener({
      disposed: () => {
        deregister();
        this.providerValues.delete(providerValue);
      }
    });
    return providerValue;
  }

  protected refreshProviderValues(resolve: (attribute: ParsedAttribute) => any) {
    this.providerValues.forEach((attribute, providerValue) => {
      const value = resolve(attribute);
      if (value === undefined) {
        providerValue.setActive(false);
      } else {
        providerValue.setValue(value);
        providerValue.setActive(true);
      }
    });
  }

  protected getProviderValues<TValue extends ParsedProviderValue<any> = ParsedProviderValue<any>>(): TValue[] {
    return Array.from(this.providerValues.keys()) as TValue[];
  }

  protected fireDirty() {
    this.iterateListeners((listener) => listener.dirty?.());
  }

  protected abstract createProviderValue<T>(attribute: ParsedAttribute): ParsedProviderValue<T>;
}
