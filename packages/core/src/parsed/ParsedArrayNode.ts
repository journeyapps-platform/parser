import { ParsedNodeValues, ParsedNodeValuesLike } from '../values/ParsedNodeValues';
import { ParsedExpressionValue } from './ParsedNodeTypes';
import { TreeNode } from '@journeyapps/common-tree';

import { V5Node } from '../nodes/V5Node';
import { AbstractValueProvider } from '../values/AbstractValueProvider';
import { ParsedDiagnostic, ParsedDiagnosticStore } from './ParsedDiagnostic';
import { ParsedNode } from './ParsedNode';

export interface ParsedArrayNodeOptions {
  definition: V5Node<any>;
  key: string;
}

export type ParsedArrayNodeChild = ParsedNode<any, any> | ParsedArrayNode<any>;

export class ParsedArrayNode<Child extends ParsedArrayNodeChild = ParsedNode<any, any>> extends TreeNode {
  public readonly definition: V5Node<any>;
  private readonly diagnostics = new ParsedDiagnosticStore();

  constructor(options: ParsedArrayNodeOptions) {
    super(options.key);
    this.definition = options.definition;
  }

  nodes(): Child[] {
    return this.getNodes<Child>();
  }

  /**
   * Resolve repeated children in order, preserving nested arrays.
   */
  valueTree(): ParsedNodeValuesLike<ParsedExpressionValue<Child>[]> {
    return new ParsedNodeValues(
      this.nodes().map((child) => child.valueTree()),
      (values) =>
        [...(values.length === 0 ? (this.definition.defaultValue ?? []) : values)] as ParsedExpressionValue<Child>[]
    );
  }

  at(index: number): Child | undefined {
    return this.nodes()[index];
  }

  setValueProviders(providers: readonly AbstractValueProvider[]): this {
    this.nodes().forEach((child) => child.setValueProviders(providers));
    return this;
  }

  pushError({ message, element, type }: ParsedDiagnostic): ParsedDiagnostic {
    const diagnostic = this.diagnostics.pushError({ message, element, type });
    if (element) {
      this.getParent<ParsedNode>()?.reportDiagnostic({ element, message, type });
    }
    return diagnostic;
  }

  errors(): ParsedDiagnostic[] {
    return this.diagnostics.errors();
  }

  hasErrors(): boolean {
    return this.diagnostics.hasErrors();
  }

  map<T>(cb: (node: Child, index: number) => T): T[] {
    return this.nodes().map(cb);
  }
}
