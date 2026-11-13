import { ParsedNodeValues, type ParsedNodeValuesLike } from '../values/ParsedNodeValues';
import type { ValueProviderContext } from '../values/ValueProviderContext';
import { ParsedNode } from './ParsedNode';
import { ParsedNodeShapeValue } from './ParsedNodeTypes';

export type ParsedContentNodeShape<Expression extends ParsedNodeShapeValue> = {
  content?: Expression;
};

/**
 * A node whose element content resolves to the codec's value rather than an object.
 */
export class ParsedContentNode<Expression extends ParsedNodeShapeValue, Value> extends ParsedNode<
  ParsedContentNodeShape<Expression>,
  Value | undefined
> {
  content(): Expression | undefined {
    return super.content();
  }

  valueTree(provider: ValueProviderContext): ParsedNodeValuesLike<Value | undefined> {
    const source = this.createValues(['content'], provider);
    return new ParsedNodeValues([source], ([value]) => (value as { content?: Value }).content);
  }
}
