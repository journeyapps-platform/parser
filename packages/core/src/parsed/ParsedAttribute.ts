import { TreeEntity } from '@journeyapps/common-tree';
import { XMLParseEvent } from '../XMLParseEvent';
import { XMLPositional } from '@journeyapps/common-xml';
import { Attribute } from '../attributes/Attribute';
import { ParsedDiagnosticStore, ParsedDiagnostic } from './ParsedDiagnostic';
import { ParsedNode } from './ParsedNode';

export interface ParsedAttributeOptions<Expression = any, Definition extends Attribute = Attribute> {
  definition: Definition;
  event: XMLParseEvent<ParsedNode>;
  expression: Expression;
  parseContext?: Record<string, any>;
}

export class ParsedAttribute<Expression = any, Definition extends Attribute = Attribute> extends TreeEntity {
  public readonly definition: Definition;
  private expressionValue: Expression;
  public readonly sourceElement: XMLPositional;
  public readonly parseContext?: Record<string, any>;
  private readonly diagnostics = new ParsedDiagnosticStore();
  private readonly reportError: (diagnostic: ParsedDiagnostic) => void;

  constructor(options: ParsedAttributeOptions<Expression, Definition>) {
    super(options.definition.options.key);
    this.definition = options.definition;
    this.sourceElement = options.event.element;
    this.reportError = options.event.helper.pushError;
    this.expressionValue = options.expression;
    this.parseContext = options.parseContext;
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

  pushError({ message, element = this.sourceElement, type }: ParsedDiagnostic): ParsedDiagnostic {
    const diagnostic = this.diagnostics.pushError({ message, element, type });
    this.reportError({ element, message, type });
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
