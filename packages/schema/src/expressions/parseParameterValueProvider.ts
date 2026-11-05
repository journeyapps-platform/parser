import { FunctionExpression, FUNCTION_PREFIX } from '@ja-platform/parser-expressions';

/**
 * Normalize serialized parameter providers once at the schema boundary.
 */
export function parseParameterValueProvider(source: string): FunctionExpression {
  const code = source.trim().replace(/^\$:/, '');
  const call = /^[\w$]+(?:\.[\w$]+)*$/.test(code) ? `${code}()` : code;
  return FunctionExpression.parse(`${FUNCTION_PREFIX}${call}`);
}
