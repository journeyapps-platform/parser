import { ParsedNodeValues, type ParsedNodeValuesLike } from '../values/ParsedNodeValues';
import type { ValueProviderContext } from '../values/ValueProviderContext';
import { ParsedNode } from './ParsedNode';
import type { ParsedChild } from './ParsedNodeTypes';

/** Preserve the selected branch's value without adding an object to the output. */
export class ParsedEitherNode<Value> extends ParsedNode<{ value?: ParsedChild }, Value | undefined> {
  valueTree(provider: ValueProviderContext): ParsedNodeValuesLike<Value | undefined> {
    const selected = this.child('value');
    if (!selected) return new ParsedNodeValues([], () => undefined);
    return selected.valueTree(provider) as ParsedNodeValuesLike<Value>;
  }
}
