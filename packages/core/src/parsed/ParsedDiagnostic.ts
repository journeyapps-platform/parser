import type { XMLDiagnostic as ParsedDiagnostic } from '@journeyapps/common-xml';
import type { ExpressionDiagnostic } from '@ja-platform/parser-expressions';

export type { XMLDiagnostic as ParsedDiagnostic } from '@journeyapps/common-xml';

export interface ParsedValidationDiagnostic extends ParsedDiagnostic {
  token?: ExpressionDiagnostic['token'];
}

export class ParsedDiagnosticStore {
  private readonly diagnostics: ParsedDiagnostic[] = [];

  pushError({ message, element, type }: ParsedDiagnostic): ParsedDiagnostic {
    const diagnostic = { element, message, type };
    this.diagnostics.push(diagnostic);
    return diagnostic;
  }

  errors(): ParsedDiagnostic[] {
    return [...this.diagnostics];
  }

  hasErrors(): boolean {
    return this.diagnostics.length > 0;
  }
}
