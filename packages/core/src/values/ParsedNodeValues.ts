import { isEqual } from 'lodash';
import { BaseObserver } from '@journeyapps/common-utils';

export interface ParsedNodeValuesListener<T> {
  changed?(value: T): void;
  disposed?(): void;
}

export interface ParsedNodeValuesLike<T> {
  readonly current: T;
  registerListener(listener: Partial<ParsedNodeValuesListener<T>>): () => void;
  dispose(): void;
}

/** Owns attribute or descendant evaluations and their combined current value. */
export class ParsedNodeValues<T> extends BaseObserver<ParsedNodeValuesListener<T>> implements ParsedNodeValuesLike<T> {
  current: T;
  private readonly deregister: Array<() => void> = [];
  private disposed = false;

  constructor(
    private readonly sources: readonly ParsedNodeValuesLike<unknown>[],
    private readonly compose: (values: readonly unknown[]) => T
  ) {
    super();
    try {
      this.current = this.read();
      for (const source of sources) {
        this.deregister.push(source.registerListener({ changed: () => this.update(this.read()) }));
      }
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  update(value: T): void {
    if (isEqual(this.current, value)) return;
    this.current = value;
    this.iterateListeners((listener) => listener.changed?.(value));
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.deregister.forEach((unsubscribe) => unsubscribe());
    this.sources.forEach((source) => source.dispose());
    this.iterateListeners((listener) => listener.disposed?.());
  }

  private read(): T {
    return this.compose(this.sources.map((source) => source.current));
  }
}
