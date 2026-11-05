import { BaseObserver } from '@journeyapps/common-utils';
import type { AbstractValueProvider } from './AbstractValueProvider';

export interface ParsedProviderValueListener<T> {
  changed?: (value: T | undefined) => void;
  disposed?: () => void;
  activeChanged?: (active: boolean) => void;
}

export interface ParsedProviderValueOptions<T> {
  value?: T;
  active: boolean;
  provider?: AbstractValueProvider;
}

/**
 * One provider's contribution. Activity is independent of its stored value and subscription lifetime.
 */
export class ParsedProviderValue<T> extends BaseObserver<ParsedProviderValueListener<T>> {
  current: T | undefined;
  active: boolean;
  private disposed = false;
  readonly provider?: AbstractValueProvider;

  constructor(options: ParsedProviderValueOptions<T>) {
    super();
    this.current = options.value;
    this.active = options.active;
    this.provider = options.provider;
  }

  /**
   * Change the stored value without changing whether this contribution is active.
   */
  setValue(value: T | undefined): void {
    if (!this.disposed && !Object.is(this.current, value)) {
      this.current = value;
      this.iterateListeners((listener) => listener.changed?.(value));
    }
  }

  /**
   * Change activity without changing the stored value.
   */
  setActive(active: boolean): void {
    if (!this.disposed && this.active !== active) {
      this.active = active;
      this.iterateListeners((listener) => listener.activeChanged?.(active));
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.setActive(false);
    this.disposed = true;
    this.iterateListeners((listener) => listener.disposed?.());
  }
}
