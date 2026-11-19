import {
  CodeToken,
  EvaluatedExpression,
  parseExpression,
  FunctionExpressionParser,
  PrefixToken,
  FunctionExpression,
  ConstantExpression,
  JSToken
} from '../src';
import { textType } from '@ja-platform/parser-type-system';
import { describe, expect, it, vi } from 'vitest';

/**
 * A command in the test language whose arguments are plain source strings.
 */
class CommandToken extends CodeToken<string> {
  readonly freeIdentifiers: readonly string[] = [];
  get code(): string {
    return this.source;
  }
  isReferenceExpression(): boolean {
    return false;
  }
  sourceOf(argument: string): string {
    return argument;
  }
  rewriteReferences(): CommandToken {
    return this.clone();
  }
  readonly arguments: readonly string[];
  constructor(
    private readonly name: string,
    args: readonly string[] = [],
    start = 0
  ) {
    super(`${name} ${args.join(' ')}`.trim(), start);
    this.arguments = args;
  }
  isCallExpression(): boolean {
    return true;
  }
  functionName(): string {
    return this.name;
  }
  withName(name: string): CommandToken {
    return new CommandToken(name, this.arguments, this.start);
  }
  withArguments(args: readonly string[]): CommandToken {
    return new CommandToken(this.name, args, this.start);
  }
  clone(): CommandToken {
    return new CommandToken(this.name, [...this.arguments], this.start);
  }
}

describe('FunctionExpression', () => {
  it('changes argument count while retaining the wrapper, comments and source', () => {
    const expression = FunctionExpression.parse('/* save */ $:save(true); // end');
    expect(expression.withArguments([]).raw()).toBe('/* save */ $:save(); // end');
    expect(
      expression
        .withArguments([ConstantExpression.parse("'one'", textType), ConstantExpression.parse("'two'", textType)])
        .raw()
    ).toBe("/* save */ $:save('one', 'two'); // end");
  });
  it('changes the call target without changing matching text in comments or arguments', () => {
    const expression = FunctionExpression.parse('/* save */ $:save("save"); // save');
    expect(expression.withName('update').raw()).toBe('/* save */ $:update("save"); // save');
  });
  it('replaces arguments while preserving surrounding tokens and evaluation source', () => {
    const source = '$:save( /* first */ "before", find(true) )';
    const expression = FunctionExpression.parse(source);
    const updated = expression.withArguments([
      ConstantExpression.parse("'it\\'s after'", textType),
      FunctionExpression.parse('$:find(false)')
    ]);
    expect(updated.raw()).toBe("$:save( /* first */ 'it\\'s after', find(false) )");
    expect(expression.raw()).toBe(source);
    expect(expression.withArgumentSources(['42', 'find(false)']).raw()).toBe('$:save( /* first */ 42, find(false) )');
    expect(updated.code()).toBe("save( /* first */ 'it\\'s after', find(false) )");
  });
  it('keeps parenthesized arguments and ignores punctuation inside comments when editing', () => {
    const expression = FunctionExpression.parse('$:save /* (comment) */ (first, (second, third))');
    expect(expression.withArgumentSources([expression.codeToken.sourceOf(expression.arguments[1])]).raw()).toBe(
      '$:save /* (comment) */ ((second, third))'
    );
    expect(expression.withArguments([]).raw()).toBe('$:save /* (comment) */ ()');
  });
  it('owns its Babel tree when cloned', () => {
    const expression = FunctionExpression.parse('$:save(find(true))');
    const clone = expression.clone();
    expect((clone.codeToken as JSToken).ast).not.toBe((expression.codeToken as JSToken).ast);
    expect(clone.arguments[0]).not.toBe(expression.arguments[0]);
    expect(clone.raw()).toBe(expression.raw());
  });
  it('exposes validity when replacing a call with another expression type', () => {
    const expression = FunctionExpression.parse('$:save()');
    expect(() => FunctionExpression.parse('$:value + 1')).toThrow(SyntaxError);
    const replaced = expression.withCode(new JSToken('true'));
    expect(replaced.isValid()).toBe(false);
    expect(expression.isValid()).toBe(true);
  });

  it('retains nested calls, arrays and objects in one Babel tree', () => {
    const source = ' $:save("Hello", [true, user.name], {value: find(null)}) /* end */ ';
    const expression = FunctionExpression.parse(source);
    expect(expression.functionName()).toBe('save');
    expect((expression.codeToken as JSToken).arguments.map((argument) => argument.type)).toEqual([
      'StringLiteral',
      'ArrayExpression',
      'ObjectExpression'
    ]);
    const object = (expression.codeToken as JSToken).arguments[2];
    expect(object.type).toBe('ObjectExpression');
    if (object.type === 'ObjectExpression' && object.properties[0].type === 'ObjectProperty') {
      expect(object.properties[0].value.type).toBe('CallExpression');
    }
    expect(expression.tokens.filter((token) => token instanceof JSToken)).toHaveLength(1);
    expect(expression.raw()).toBe(source);
  });

  it('supports existing tree tokens without changing their identity', () => {
    const tokens = [new PrefixToken(20), new JSToken('save(true)', 22)];
    const expression = new FunctionExpressionParser().tryParse(tokens);
    expect(expression.tokens).toEqual(tokens);
    expect(expression.codeToken).toBe(tokens[1]);
    expect(parseExpression(tokens)).toBeInstanceOf(FunctionExpression);
    expect(() => FunctionExpression.parse('true')).toThrow(SyntaxError);
    expect(() => FunctionExpression.parse('')).toThrow(SyntaxError);
  });

  it('rejects malformed calls and non-call token structures', () => {
    expect(() => FunctionExpression.parse('$:save(')).toThrow(SyntaxError);
    expect(new FunctionExpression({ tokens: [new PrefixToken(), new JSToken('true')] }).isValid()).toBe(false);
  });

  it('uses the language token for function classification and call edits', () => {
    const token = new CommandToken('select', ['name', 'users'], 2);
    const expression = FunctionExpression.parse([new PrefixToken(), token]);
    expect(parseExpression(expression.tokens)).toBeInstanceOf(FunctionExpression);
    expect(expression.isValid()).toBe(true);
    expect(expression.functionName()).toBe('select');
    expect(expression.arguments.map((argument) => expression.codeToken.sourceOf(argument))).toEqual(['name', 'users']);
    const edited = expression.withName('fetch').withArgumentSources(['id', 'accounts']);
    expect(edited.raw()).toBe('$:fetch id accounts');
    expect(edited.codeToken).toBeInstanceOf(CommandToken);
    expect(edited.clone().codeToken).not.toBe(edited.codeToken);
    expect(expression.raw()).toBe('$:select name users');
  });

  it('exposes call operations only for prefixed calls', () => {
    for (const source of ['$:true', "$:{thing:'other'}", '$:user.name', '$:ready ? greet() : null']) {
      const expression = parseExpression(source);
      expect(expression.constructor).toBe(EvaluatedExpression);
      expect('functionName' in expression).toBe(false);
      expect('arguments' in expression).toBe(false);
      expect(new FunctionExpressionParser().tryParse(source)).toBeNull();
      expect(() => FunctionExpression.parse(source)).toThrow(SyntaxError);
    }
    for (const source of ['$:save()', '$:save?.()', '$:(save())']) {
      expect(parseExpression(source).constructor).toBe(FunctionExpression);
    }
  });

  it('does not resolve references or execute code during validation', () => {
    const scope = { getReference: vi.fn() };
    expect(FunctionExpression.parse('$:save()').validate(scope)).toEqual([]);
    expect(scope.getReference).not.toHaveBeenCalled();
  });
});
