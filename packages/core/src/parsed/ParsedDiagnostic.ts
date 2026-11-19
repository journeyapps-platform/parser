import type { SourceReference } from '../source/SourceReference';
import type { ExpressionDiagnostic } from '@ja-platform/parser-expressions';

export interface ParsedDiagnostic {
  message: string;
  type?: 'error' | 'warning';
  source?: SourceReference;
}

export interface ParsedValidationDiagnostic extends ParsedDiagnostic {
  token?: ExpressionDiagnostic['token'];
}

export class ParsedDiagnosticStore {
  private readonly diagnostics: ParsedDiagnostic[] = [];

  pushError({ message, type, source }: ParsedDiagnostic): ParsedDiagnostic {
    const diagnostic: ParsedDiagnostic = { message, type };
    if (source) diagnostic.source = source;
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
