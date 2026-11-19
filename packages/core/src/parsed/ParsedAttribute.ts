import type { AttributeInput } from '../input/AttributeInput';
import { TreeEntity } from '@journeyapps/common-tree';
import { Attribute } from '../attributes/Attribute';
import { ParsedDiagnosticStore, ParsedDiagnostic } from './ParsedDiagnostic';
import { ParsedNode } from './ParsedNode';

export interface ParsedAttributeOptions<Expression = any, Definition extends Attribute = Attribute> {
  definition: Definition;
  input?: AttributeInput;
  reportError?: (diagnostic: ParsedDiagnostic) => void;
  expression: Expression;
}

export class ParsedAttribute<Expression = any, Definition extends Attribute = Attribute> extends TreeEntity {
  public readonly definition: Definition;
  private expressionValue: Expression;
  public readonly input?: AttributeInput;
  private readonly diagnostics = new ParsedDiagnosticStore();
  private readonly reportError: (diagnostic: ParsedDiagnostic) => void;

  constructor(options: ParsedAttributeOptions<Expression, Definition>) {
    super(options.definition.options.key);
    this.definition = options.definition;
    this.input = options.input;
    this.reportError = options.reportError ?? (() => undefined);
    this.expressionValue = options.expression;
  }

  get name(): string {
    return this.definition.options.name;
  }

  expression(): Expression {
    return this.expressionValue;
  }

  setExpression(value: Expression) {
    this.expressionValue = value;
  }

  pushError({ message, type, source = this.input?.source }: ParsedDiagnostic): ParsedDiagnostic {
    const diagnostic = this.diagnostics.pushError({ message, type, source });
    this.reportError(diagnostic);
    return diagnostic;
  }

  errors(): ParsedDiagnostic[] {
    return this.diagnostics.errors();
  }

  hasErrors(): boolean {
    return this.diagnostics.hasErrors();
  }

  stringify() {
    return this.definition.stringify(this.expressionValue, this.getParent<ParsedNode>());
  }
}
