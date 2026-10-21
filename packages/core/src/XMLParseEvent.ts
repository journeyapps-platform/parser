import type { ParsedDiagnostic } from './parsed/ParsedDiagnostic';
import type { XMLElement } from '@journeyapps/domparser/types';
import type {
  AbstractExpression,
  ValidationContext,
  FormatStringExpression,
  EvaluatedExpression
} from '@ja-platform/parser-expressions';
import type { ParsedNode } from './parsed/ParsedNode';
import type { Attribute } from './attributes/Attribute';

export interface XMLParseEventHelper<
  Node extends ParsedNode = ParsedNode,
  Scope extends ValidationContext = ValidationContext,
  Expression extends AbstractExpression = FormatStringExpression | EvaluatedExpression
> {
  /**
   * Resolve context-specific syntax before using the attribute's parser.
   */
  parseAttributeExpression?({
    attribute,
    source
  }: {
    attribute: Attribute;
    source: string;
  }): AbstractExpression | undefined;
  /**
   * Prepare a node after its attributes and before its children are parsed.
   */
  prepareNode?(node: Node): void;
  validateFormatAttribute?({
    element,
    attribute,
    scope,
    expression
  }: {
    element: XMLElement;
    attribute: string;
    scope: Scope;
    expression: Expression;
  }): void;
  validateFormatContent?({
    element,
    scope,
    expression
  }: {
    element: XMLElement;
    scope: Scope;
    expression: Expression;
  }): void;
  pushError(diagnostic: ParsedDiagnostic): void;
}

export interface XMLParseEvent<ParentNode, Helper extends XMLParseEventHelper = XMLParseEventHelper> {
  element: XMLElement;
  parentNode?: ParentNode;
  parsedNode?: ParentNode;
  scope?: ValidationContext;
  helper: Helper;
}
