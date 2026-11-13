import { BaseObserver } from '@journeyapps/common-utils';
import type { AbstractValueProvider } from './AbstractValueProvider';
import type { ParsedAttribute } from '../parsed/ParsedAttribute';
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
 * Subscribes to every contribution and keeps the current winning value.
 */
export class ParsedValue<T> extends BaseObserver<ParsedValueListener<T | undefined>> {
  current: T | undefined;
  readonly providerValues: readonly ParsedProviderValue<unknown>[];
  private disposed = false;
  private readonly deregister: (() => void)[];
  private selected?: ParsedProviderValue<unknown>;

  constructor(
    private readonly attribute: ParsedAttribute,
    providers: readonly AbstractValueProvider[]
  ) {
    super();
    this.providerValues = Object.freeze(
      providers
        .map((provider) => provider.value(attribute))
        .filter((value): value is ParsedProviderValue<unknown> => value !== undefined)
    );
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

  dispose(): void {
    if (!this.disposed) {
      this.disposed = true;
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
