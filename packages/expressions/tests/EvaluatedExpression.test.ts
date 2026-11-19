import { describe, expect, it } from 'vitest';
import { EvaluatedExpression, CodeToken, JSToken, parseExpression, PrefixToken } from '../src';

/**
 * A test language token with no JavaScript parser or AST.
 */
class QueryToken extends CodeToken<string> {
  readonly freeIdentifiers: readonly string[] = [];
  readonly arguments: readonly string[] = [];
  readonly code: string;
  constructor(source: string, start = 0) {
    super(source, start);
    this.code = source.trim();
  }
  isCallExpression(): boolean {
    return false;
  }
  isReferenceExpression(): boolean {
    return false;
  }
  functionName(): string {
    throw new Error('Queries do not have a function name.');
  }
  sourceOf(argument: string): string {
    return argument;
  }
  withName(_name: string): QueryToken {
    throw new Error('Queries do not support call edits.');
  }
  withArguments(_args: readonly string[]): QueryToken {
    throw new Error('Queries do not support call edits.');
  }
  rewriteReferences(): QueryToken {
    return this.clone();
  }
  clone(): QueryToken {
    return new QueryToken(this.source, this.start);
  }
}

describe('EvaluatedExpression', () => {
  it.each([
    ['[first,, ...second]', 'ArrayExpression'],
    ['{[field]: worker.name, ...other, method() { return true; }}', 'ObjectExpression'],
    ['ready ? "Yes" : null', 'ConditionalExpression'],
    ['value + 1', 'BinaryExpression'],
    ['save(true)', 'CallExpression']
  ])('represents %s using one JavaScript token', (source, kind) => {
    const prefixed = `$:${source}`;
    const expression = EvaluatedExpression.parse(prefixed);
    expect(expression.tokens).toHaveLength(2);
    const token = expression.codeToken;
    expect(token).toBeInstanceOf(CodeToken);
    expect(token).toBeInstanceOf(JSToken);
    if (token instanceof JSToken) expect(token.ast.type).toBe(kind);
    expect(expression.raw()).toBe(prefixed);
    expect(expression.code()).toBe(source);
  });

  it('clones its code token and AST independently while preserving source', () => {
    const expression = EvaluatedExpression.parse('$:value + 1');
    const clone = expression.clone();
    expect(clone).toBeInstanceOf(EvaluatedExpression);
    expect(clone.codeToken).not.toBe(expression.codeToken);
    expect((clone.codeToken as JSToken).ast).not.toBe((expression.codeToken as JSToken).ast);
    expect(clone.raw()).toBe(expression.raw());
  });

  it('accepts another language without inspecting a Babel node', () => {
    const token = new QueryToken('  select name from users  ', 12);
    const expression = EvaluatedExpression.parse([new PrefixToken(10), token]);
    expect(expression.codeToken).toBe(token);
    expect(parseExpression(expression.tokens)).toBeInstanceOf(EvaluatedExpression);
    expect(expression.raw()).toBe(`$:${token.source}`);
    expect(expression.code()).toBe('select name from users');
    expect(expression.clone().codeToken).toBeInstanceOf(QueryToken);
    const updated = expression.withCode(new QueryToken('select id from users'));
    expect(updated.raw()).toBe('$:select id from users');
    expect(expression.raw()).toBe(`$:${token.source}`);
  });

  it.each(['$:myVar', '$:journey.version', "$:user['name'].length"])(
    'recognizes prefixed expressions without changing source: %s',
    (source) => {
      const expression = parseExpression(source);
      expect(expression).toBeInstanceOf(EvaluatedExpression);
      expect(expression.constructor).toBe(EvaluatedExpression);
      expect(expression.raw()).toBe(source);
    }
  );

  it('preserves operators, parentheses and conditional branch types', () => {
    const source = '$: (ready || enabled) ? "Yes" : null';
    const expression = parseExpression(source) as EvaluatedExpression;
    expect(expression.constructor).toBe(EvaluatedExpression);
    const node = (expression.codeToken as JSToken).ast;
    expect(node.type).toBe('ConditionalExpression');
    if (node.type === 'ConditionalExpression') {
      expect([node.test.type, node.consequent.type, node.alternate.type]).toEqual([
        'LogicalExpression',
        'StringLiteral',
        'NullLiteral'
      ]);
    }
    expect(expression.raw()).toBe(source);
    expect(expression.code()).toBe('(ready || enabled) ? "Yes" : null');
  });

  it('rejects malformed code and incomplete or reversed token sequences', () => {
    for (const source of ['$:save(', '$:[1, 2', '$:{name:}']) {
      expect(() => EvaluatedExpression.parse(source)).toThrow(SyntaxError);
    }
    expect(new EvaluatedExpression({ tokens: [new PrefixToken()] }).isValid()).toBe(false);
    expect(new EvaluatedExpression({ tokens: [new JSToken('true'), new PrefixToken()] }).isValid()).toBe(false);
  });
});
