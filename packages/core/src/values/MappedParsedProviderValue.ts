import type { ParsedValueLike } from './ParsedValue';
import { ParsedProviderValue } from './ParsedProviderValue';

export interface MappedParsedProviderValueOptions<Source, Value> {
  /** Ownership of this source handle transfers to the mapped value. */
  source: ParsedValueLike<Source>;
  map(value: Source): Value | undefined;
}

/** Maps an observable source; undefined means this contribution is inactive. */
export class MappedParsedProviderValue<Source, Value> extends ParsedProviderValue<Value> {
  constructor(options: MappedParsedProviderValueOptions<Source, Value>) {
    const initial = options.map(options.source.current);
    super({ value: initial, active: initial !== undefined });

    const unsubscribe = options.source.registerListener({
      changed: (source) => this.updateMappedValue(options.map(source))
    });
    this.registerListener({
      disposed: () => {
        unsubscribe();
        options.source.dispose();
      }
    });
  }

  private updateMappedValue(value: Value | undefined): void {
    if (value === undefined) {
      this.setActive(false);
      this.setValue(undefined);
      return;
    }
    this.setValue(value);
    this.setActive(true);
  }
}
