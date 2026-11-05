import { ParsedNodeValues, ParsedNodeValuesLike } from '../values/ParsedNodeValues';
import { ParsedExpressionValue } from './ParsedNodeTypes';
import { TreeNode } from '@journeyapps/common-tree';

import type { SourceReference } from '../source/SourceReference';
import { Node } from '../nodes/Node';
import { AbstractValueProvider } from '../values/AbstractValueProvider';
import { ParsedDiagnostic, ParsedDiagnosticStore } from './ParsedDiagnostic';
import { ParsedNode } from './ParsedNode';

export interface ParsedArrayNodeOptions {
  definition: Node<any>;
  key: string;
  inputPresent?: boolean;
  source?: SourceReference;
}

export type ParsedArrayNodeChild = ParsedNode<any, any> | ParsedArrayNode<any>;

export class ParsedArrayNode<Child extends ParsedArrayNodeChild = ParsedNode<any, any>> extends TreeNode {
  public readonly definition: Node<any>;
  readonly inputPresent?: boolean;
  readonly source?: SourceReference;
  private readonly diagnostics = new ParsedDiagnosticStore();

  constructor(options: ParsedArrayNodeOptions) {
    super(options.key);
    this.definition = options.definition;
    this.inputPresent = options.inputPresent;
    this.source = options.source;
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
        [
          ...(values.length === 0 && !this.inputPresent ? (this.definition.defaultValue ?? []) : values)
        ] as ParsedExpressionValue<Child>[]
    );
  }

  at(index: number): Child | undefined {
    return this.nodes()[index];
  }

  setValueProviders(providers: readonly AbstractValueProvider[]): this {
    this.nodes().forEach((child) => child.setValueProviders(providers));
    return this;
  }

  pushError({ message, source, type }: ParsedDiagnostic): ParsedDiagnostic {
    const diagnostic = this.diagnostics.pushError({ message, source, type });
    if (source) {
      this.getParent<ParsedNode>()?.reportDiagnostic({ source, message, type });
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
