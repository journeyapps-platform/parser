import {
  CombinedParser,
  EvaluatedExpression,
  EvaluatedExpressionParser,
  FunctionExpressionParser,
  ShorthandExpression,
  ShorthandExpressionParser
} from '@ja-platform/parser-expressions';
import { Attribute, AttributeGenerics } from './Attribute';

export type CombinedExpression = EvaluatedExpression | ShorthandExpression;

export interface ExpressionAttributeGenerics extends AttributeGenerics {
  Value: CombinedExpression | null;
}

/**
 * An attribute containing a reference or explicitly evaluated code.
 * Examples include `user.name`, `$object.quantity` and `$:calculateTotal()`.
 * Bare identifiers always represent references; there is no literal text fallback.
 */
export class ExpressionAttribute extends Attribute<ExpressionAttributeGenerics> {
  static TYPE = 'expression-attribute';

  constructor(options: ExpressionAttributeGenerics['Options']) {
    super(ExpressionAttribute.TYPE, {
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
}
