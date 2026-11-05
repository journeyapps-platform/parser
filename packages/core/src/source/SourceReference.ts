/** Offsets use UTF-16 code units; end is exclusive. */
export interface SourceRange {
  readonly start: number;
  readonly end: number;
}

/** Format adapters can extend this with their original syntax objects. */
export interface SourceReference {
  readonly range: SourceRange;
}
