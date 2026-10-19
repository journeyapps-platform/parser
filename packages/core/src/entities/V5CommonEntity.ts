import { V5Node } from '../nodes/V5Node';
import { V5AbstractEntity, V5AbstractEntityGenerics, V5AbstractEntityOptions } from './V5AbstractEntity';

export interface V5CommonEntityOptions extends V5AbstractEntityOptions {
  docs?: string;
  /**
   * Request the enclosing collection scope from a parser that supports scoped declarations.
   */
  queryScoped?: boolean;
}

export interface V5CommonEntityListener {}

export interface V5CommonEntityGenerics extends V5AbstractEntityGenerics {
  Options: V5CommonEntityOptions;
  Listener: V5CommonEntityListener;
}

export abstract class V5CommonEntity<
  G extends V5CommonEntityGenerics = V5CommonEntityGenerics
> extends V5AbstractEntity<G> {
  listeners: G['Listener'][];
  parent: V5Node<any>;

  constructor(options: G['Options']) {
    super(options);
    this.parent = null;
    this.listeners = [];
  }

  serialize() {
    return {
      ...super.serialize(),
      ...(this.options.queryScoped == null ? {} : { queryScoped: this.options.queryScoped })
    };
  }

  getRootNode(): V5Node<any> {
    return this.parent ? this.parent.getRootNode() : (this as unknown as V5Node<any>);
  }

  registerListener(listener: G['Listener']) {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((item) => item !== listener);
    };
  }

  fireListeners(cb: (listener: G['Listener']) => any) {
    for (let listener of this.listeners) {
      cb(listener);
    }
  }

  setParent(parent: V5Node<any>) {
    this.parent = parent;
  }
}
