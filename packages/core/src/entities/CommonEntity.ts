import { Node } from '../nodes/Node';
import { AbstractEntity, AbstractEntityGenerics, AbstractEntityOptions } from './AbstractEntity';

export interface CommonEntityOptions extends AbstractEntityOptions {
  docs?: string;
  /**
   * Request the enclosing collection scope from a parser that supports scoped declarations.
   */
  queryScoped?: boolean;
}

export interface CommonEntityListener {}

export interface CommonEntityGenerics extends AbstractEntityGenerics {
  Options: CommonEntityOptions;
  Listener: CommonEntityListener;
}

export abstract class CommonEntity<G extends CommonEntityGenerics = CommonEntityGenerics> extends AbstractEntity<G> {
  listeners: G['Listener'][];
  parent: Node<any>;

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

  getRootNode(): Node<any> {
    return this.parent ? this.parent.getRootNode() : (this as unknown as Node<any>);
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

  setParent(parent: Node<any>) {
    this.parent = parent;
  }
}
