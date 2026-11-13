import type { AbstractValueProvider } from './AbstractValueProvider';

/** Supplies the provider order for independently owned parsed-node evaluations. */
export interface ValueProviderContext {
  readonly providers: readonly AbstractValueProvider[];
}
