import { CombinedParser } from '../CombinedParser';
import { AbstractExpression } from '../expressions/AbstractExpression';
import { EvaluatedExpressionParser } from '../expressions/EvaluatedExpression';
import { ConstantExpressionParser } from '../expressions/constant/ConstantExpression';
import { FormatShorthandExpressionParser } from '../expressions/shorthand/FormatShorthandExpression';
import { FunctionExpressionParser } from '../expressions/function/FunctionExpression';
import { ShorthandExpressionParser } from '../expressions/shorthand/ShorthandExpression';
import { ExpressionSource } from '../tokens/AbstractToken';

/**
 * Recognize evaluated code and references before preserving remaining input as constant text.
 * Callers can compose their own parser order instead.
 */
export function parseExpression(source: ExpressionSource, start = 0): AbstractExpression | null {
  return new CombinedParser<AbstractExpression>([
    new FunctionExpressionParser(),
    new EvaluatedExpressionParser(),
    new FormatShorthandExpressionParser(),
    new ShorthandExpressionParser(),
    new ConstantExpressionParser()
  ]).tryParse(source, start);
}
