import type { AttributeInputLocation } from './AttributeInput';
import type { AbstractExpression } from '@ja-platform/parser-expressions';
import type { Attribute } from '../attributes/Attribute';
import type { ParsedDiagnostic } from '../parsed/ParsedDiagnostic';
import type { SourceReference } from '../source/SourceReference';
import type { ParsedNode } from '../parsed/ParsedNode';

export interface AttributeParseContext {
  /** The enclosing parsed node, e.g. the field containing an option node. */
  parentNode?: ParsedNode;
  validateExpression?(input: {
    attribute: Attribute;
    expression: AbstractExpression;
    source?: SourceReference;
    location?: AttributeInputLocation;
  }): void;
  report(diagnostic: ParsedDiagnostic): void;
  parseAttributeExpression?(input: { attribute: Attribute; source: string }): AbstractExpression | undefined;
}
