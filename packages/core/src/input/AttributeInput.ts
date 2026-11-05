import type { SourceReference } from '../source/SourceReference';

export enum AttributeInputKind {
  TEXT = 'text',
  LITERAL = 'literal'
}

export enum AttributeInputLocation {
  ATTRIBUTE = 'attribute',
  CONTENT = 'content'
}

export type AttributeLiteralValue =
  | string
  | number
  | boolean
  | null
  | readonly AttributeLiteralValue[]
  | { readonly [key: string]: AttributeLiteralValue };

export interface AttributeInputBase {
  readonly source?: SourceReference;
  readonly location?: AttributeInputLocation;
}

/** Text is interpreted using the attribute's expression syntax. */
export interface TextAttributeInput extends AttributeInputBase {
  readonly kind: AttributeInputKind.TEXT;
  readonly value: string;
}

/** Native data bypasses expression syntax and uses the attribute's value type. */
export interface LiteralAttributeInput extends AttributeInputBase {
  readonly kind: AttributeInputKind.LITERAL;
  readonly value: AttributeLiteralValue;
}

/** Undefined input means absent; a literal null is explicitly authored. */
export type AttributeInput = TextAttributeInput | LiteralAttributeInput;
