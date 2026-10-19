import {
  CombinedParser,
  EvaluatedExpression,
  EvaluatedExpressionParser,
  FunctionExpressionParser,
  ShorthandExpression,
  ShorthandExpressionParser
} from '@ja-platform/parser-expressions';
import { V5EditorHelpers } from '../events/V5EditorContext';
import { V5Attribute, V5AttributeGenerics } from './V5Attribute';

export type CombinedExpression = EvaluatedExpression | ShorthandExpression;

export interface V5ExpressionAttributeGenerics extends V5AttributeGenerics {
  Value: CombinedExpression | null;
}

/**
 * An attribute containing a reference or explicitly evaluated code.
 * Examples include `user.name`, `$object.quantity` and `$:calculateTotal()`.
 * Bare identifiers always represent references; there is no literal text fallback.
 */
export class V5ExpressionAttribute extends V5Attribute<V5ExpressionAttributeGenerics> {
  static TYPE = 'expression-attribute';

  constructor(options: V5ExpressionAttributeGenerics['Options']) {
    super(V5ExpressionAttribute.TYPE, {
      ...options,
      syntax:
        options.syntax ??
        new CombinedParser<CombinedExpression>([
          new FunctionExpressionParser(),
          new EvaluatedExpressionParser(),
          new ShorthandExpressionParser()
        ])
    });
  }

  getEditorV5Syntax<T>(helpers: V5EditorHelpers<T>): T {
    return helpers.typedBindingOrFunction({
      types: null,
      writable: false,
      constants: false
    });
  }
}
