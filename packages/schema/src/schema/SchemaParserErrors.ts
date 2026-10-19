import { error, ValidationError, XMLDiagnostic } from '@journeyapps/common-xml';
import { XMLError } from '@journeyapps/domparser/types';

export class SchemaParserErrors {
  private errors: (ValidationError | XMLError)[];

  constructor() {
    this.errors = [];
  }

  pushError({ element, message, type }: XMLDiagnostic) {
    this.errors.push(error(element, message, type));
  }

  pushErrors(newErrors: (ValidationError | XMLError)[]) {
    for (let i = 0; i < newErrors.length; i++) {
      const err = newErrors[i];
      this.errors.push(err);
    }
  }

  reset() {
    this.errors = [];
  }

  getErrors() {
    return this.errors;
  }
}
