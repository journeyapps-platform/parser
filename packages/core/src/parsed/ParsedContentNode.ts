import { ParsedNode } from './ParsedNode';
import { ParsedNodeShapeValue } from './ParsedNodeTypes';
import { ParsedNodeValues, ParsedNodeValuesLike } from '../values/ParsedNodeValues';

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

  valueTree(): ParsedNodeValuesLike<Value | undefined> {
    const [[, source]] = this.collectAttributeValues(['content']);
    return new ParsedNodeValues([source], ([value]) => value as Value | undefined);
  }
}
