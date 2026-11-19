export class SchemaError extends Error {
  constructor(
    message: string,
    readonly attribute: string
  ) {
    super(message);
    this.name = 'SchemaError';
  }
}
