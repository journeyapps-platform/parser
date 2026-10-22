import { BaseObserver } from '@journeyapps/common-utils';
import type { AbstractValueProvider } from './AbstractValueProvider';
import { ParsedAttribute } from '../parsed/ParsedAttribute';
import { ParsedProviderValue } from './ParsedProviderValue';

export interface ParsedValueListener<T> {
  changed?: (value: T) => void;
  disposed?: () => void;
}

export interface ParsedValueLike<T> {
  readonly current: T;
  registerListener(listener: Partial<ParsedValueListener<T>>): () => void;
  dispose(): void;
}

/**
 * Creates contributions from providers ordered from lowest to highest priority.
 * Subscribes to every contribution and caches the last active value.
 */
export class ParsedValue<T> extends BaseObserver<ParsedValueListener<T | undefined>> {
  current: T | undefined;
  readonly providerValues: readonly ParsedProviderValue<unknown>[];
  private retainCount = 0;
  private released = false;
  private readonly deregister: (() => void)[];
  private selected?: ParsedProviderValue<unknown>;

  constructor(
    private readonly attribute: ParsedAttribute,
    providers: readonly AbstractValueProvider[]
  ) {
    super();
    this.providerValues = Object.freeze(providers.map((provider) => provider.value(attribute)));
    this.deregister = this.providerValues.map((value) =>
      value.registerListener({
        changed: () => this.refresh(),
        activeChanged: () => this.refresh()
      })
    );
    this.refresh();
  }

  get activeValue(): ParsedProviderValue<unknown> | undefined {
    return this.selected;
  }

  /**
   * Keep this resolved value and its contributions alive for another consumer.
   */
  retain(): this {
    if (!this.released) {
      this.retainCount++;
    }
    return this;
  }

  /**
   * Dispose contributions when the last consumer releases this value.
   */
  release(): void {
    if (this.retainCount > 0) {
      this.retainCount--;
    }
    if (this.retainCount === 0) {
      this.dispose();
    }
  }

  dispose(): void {
    if (!this.released) {
      this.released = true;
      this.deregister.forEach((unsubscribe) => unsubscribe());
      this.providerValues.forEach((value) => value.dispose());
      this.iterateListeners((listener) => listener.disposed?.());
    }
  }

  private refresh(): void {
    let selected: ParsedProviderValue<unknown> | undefined;
    for (const value of this.providerValues) {
      if (value.active) {
        selected = value;
      }
    }
    // Keep the winning entry current even when another provider supplies the same resolved value.
    this.selected = selected;
    let current = selected?.current;
    if (current != null) {
      current = this.attribute.definition.normalizeValue(current);
    }
    if (!Object.is(this.current, current)) {
      this.current = current as T | undefined;
      this.iterateListeners((listener) => listener.changed?.(this.current));
    }
  }
}
