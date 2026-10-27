import { textType } from '@ja-platform/parser-type-system';
import { describe, expect, it } from 'vitest';
import {
  ExpressionParser,
  ExpressionSource,
  parseExpression,
  CombinedParser,
  FunctionExpressionParser,
  ShorthandExpressionParser,
  EvaluatedExpressionParser,
  ConstantExpressionParser,
  ConstantExpression,
  FunctionExpression,
  ShorthandExpression,
  EvaluatedExpression,
  PrefixToken
} from '../src';

describe('CombinedParser', () => {
  it('combines evaluated syntax with literal text without inferring the target value type', () => {
    const parser = new CombinedParser<EvaluatedExpression | ConstantExpression>([
      new FunctionExpressionParser(),
      new EvaluatedExpressionParser(),
      new ConstantExpressionParser()
    ]);
    const literal = parser.tryParse('1e3');
    expect(literal).toBeInstanceOf(ConstantExpression);
    expect((literal as ConstantExpression).value()).toBe('1e3');
    expect(parser.tryParse('$:count()')).toBeInstanceOf(FunctionExpression);
    expect(parser.tryParse('$:count + 1')).toBeInstanceOf(EvaluatedExpression);
    expect(() => parser.tryParse('$:broken(')).toThrow(SyntaxError);
  });

  it('uses caller-defined order and stops after the first matching parser', () => {
    const visited: string[] = [];
    const parser = new CombinedParser([
      new (class extends ExpressionParser<ConstantExpression> {
        tryParse() {
          visited.push('first');
          return null;
        }
      })(),
      new (class extends ExpressionParser<ConstantExpression> {
        tryParse(source: ExpressionSource) {
          visited.push('second');
          return ConstantExpression.parse(source, textType);
        }
      })(),
      new (class extends ExpressionParser<ConstantExpression> {
        tryParse(): never {
          throw new Error('Must not be visited');
        }
      })()
    ]);
    expect(parser.tryParse('hello').raw()).toBe('hello');
    expect(visited).toEqual(['first', 'second']);
    expect(new CombinedParser([]).tryParse('hello')).toBeNull();
  });

  it('distinguishes an unrecognized syntax from malformed recognized input', () => {
    const parser = new CombinedParser([new FunctionExpressionParser(), new ShorthandExpressionParser()]);
    expect(parser.tryParse('42')).toBeNull();
    expect(new FunctionExpressionParser().tryParse('worker')).toBeNull();
    expect(parser.tryParse('worker')).toBeInstanceOf(ShorthandExpression);
    expect(() => parser.tryParse('$:broken(')).toThrow(SyntaxError);
    expect(new CombinedParser([new EvaluatedExpressionParser()]).tryParse('')).toBeNull();
    expect(parseExpression('broken(')).toBeInstanceOf(ConstantExpression);
    expect(() => parseExpression('$:broken(')).toThrow(SyntaxError);
  });

  it('requires valid matches while preserving parser failures and source positions', () => {
    const parser = new CombinedParser([new FunctionExpressionParser(), new ShorthandExpressionParser()]);
    expect(() => parser.parse('42')).toThrow('Input does not match CombinedParser.');
    expect(parser.parse('worker', 20).start).toBe(20);
    const failure = new SyntaxError('Invalid source');
    const failing = new (class extends ExpressionParser {
      tryParse(): never {
        throw failure;
      }
    })();
    expect(() => failing.parse('source')).toThrow(failure);
    const invalid = new (class extends ExpressionParser<EvaluatedExpression> {
      tryParse() {
        return new EvaluatedExpression({ tokens: [new PrefixToken()] });
      }
    })();
    expect(() => invalid.parse('$:')).toThrow(SyntaxError);
  });

  it('preserves source offsets through composition', () => {
    const parser = new CombinedParser([new FunctionExpressionParser()]);
    const expression = parser.tryParse('$:save(true)', 20);
    expect(expression.tokens.map((token) => token.start)).toEqual([20, 22]);
  });
});
