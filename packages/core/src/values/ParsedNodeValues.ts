import * as _ from 'lodash';
import { BaseObserver } from '@journeyapps/common-utils';
import { ParsedValue } from './ParsedValue';

export interface ParsedNodeValuesListener<T> {
  changed?: (value: T) => void;
  disposed?: () => void;
}

export interface ParsedNodeValuesLike<T> {
  readonly current: T;
  registerListener(listener: Partial<ParsedNodeValuesListener<T>>): () => void;
  dispose(): void;
}

/**
 * Combine attribute or descendant values into one disposable value.
 */
export class ParsedNodeValues<T> extends BaseObserver<ParsedNodeValuesListener<T>> implements ParsedNodeValuesLike<T> {
  current: T;
  private readonly deregister: Array<() => void>;
  private disposed = false;

  constructor(
    private readonly sources: readonly ParsedNodeValuesLike<unknown>[],
    private readonly compose: (values: readonly unknown[]) => T
  ) {
    super();
    this.current = this.read();
    this.deregister = sources.map((source) => source.registerListener({ changed: () => this.update(this.read()) }));
  }

  update(value: T) {
    if (_.isEqual(this.current, value)) {
      return;
    }
    this.current = value;
    this.iterateListeners((listener) => listener.changed?.(value));
  }

  dispose() {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.deregister.forEach((deregister) => deregister());
    this.sources.forEach((source) => {
      if (source instanceof ParsedValue) {
        source.release();
      } else {
        source.dispose();
      }
    });
    this.iterateListeners((listener) => listener.disposed?.());
  }

  private read(): T {
    return this.compose(this.sources.map((source) => source.current));
  }
}
