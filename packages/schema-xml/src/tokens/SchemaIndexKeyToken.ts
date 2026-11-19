import { AbstractToken } from '@ja-platform/parser-expressions';
import { attribute } from '@journeyapps/common-xml';
import { IndexDirection } from '@ja-platform/parser-schema';

/**
 * An index field reference with its optional sort direction.
 */
export class SchemaIndexKeyToken extends AbstractToken {
  constructor(
    readonly source: string,
    start = 0
  ) {
    super(start);
    Object.freeze(this);
  }

  get field(): string {
    return /^[+-]/.test(this.source) ? this.source.slice(1) : this.source;
  }

  get direction(): IndexDirection {
    return this.source.startsWith('-') ? IndexDirection.DESCENDING : IndexDirection.ASCENDING;
  }

  isValid(): boolean {
    try {
      attribute.name(this.field);
      return true;
    } catch {
      return false;
    }
  }

  raw(): string {
    return this.source;
  }

  clone(): this {
    return this;
  }
}
