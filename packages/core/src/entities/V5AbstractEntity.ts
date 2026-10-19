export interface V5AbstractEntityOptions {
  key?: string;
  name: string;
  description?: string;
}

export interface V5AbstractEntityGenerics {
  Options: V5AbstractEntityOptions;
}

export abstract class V5AbstractEntity<G extends V5AbstractEntityGenerics = V5AbstractEntityGenerics> {
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
