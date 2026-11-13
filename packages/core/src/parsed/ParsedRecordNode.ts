import { ParsedNodeValues, type ParsedNodeValuesLike } from '../values/ParsedNodeValues';
import type { ValueProviderContext } from '../values/ValueProviderContext';
import { ParsedNode } from './ParsedNode';

/** Only document keys become entries; the entry definition does not imply a default key. */
export class ParsedRecordNode<Entry extends ParsedNode<any, any>, Value> extends ParsedNode<
  Record<string, Entry>,
  Record<string, Value>
> {
  valueTree(provider: ValueProviderContext): ParsedNodeValuesLike<Record<string, Value>> {
    const entries = this.nodes();
    return new ParsedNodeValues(
      entries.map((entry) => entry.valueTree(provider)),
      (values) =>
        Object.fromEntries(entries.map((entry, index) => [entry.getKey(), values[index]])) as Record<string, Value>
    );
  }
}
