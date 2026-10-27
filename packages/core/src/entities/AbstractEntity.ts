export interface AbstractEntityOptions {
  key?: string;
  name: string;
  description?: string;
}

export interface AbstractEntityGenerics {
  Options: AbstractEntityOptions;
}

export abstract class AbstractEntity<G extends AbstractEntityGenerics = AbstractEntityGenerics> {
  options: G['Options'];

  constructor(options: G['Options']) {
    this.options = {
      ...options,
      // key will default to name unless specified
      key: options.key || options.name
    };
  }

  serialize() {
    return {
      name: this.options.name
    };
  }
}
