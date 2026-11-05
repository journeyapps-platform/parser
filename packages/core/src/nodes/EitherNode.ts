import { NodeInputKind, type NodeInput, type NodeInputSelection } from '../input/NodeInput';
import { ParsedArrayNode } from '../parsed/ParsedArrayNode';
import { ParsedEitherNode } from '../parsed/ParsedEitherNode';
import { ParsedNode } from '../parsed/ParsedNode';
import type { ParsedChild } from '../parsed/ParsedNodeTypes';
import { ContentNode } from './ContentNode';
import { Node, type NodeGenerics, type NodeOptions, type ParseTreeOptions } from './Node';

export interface EitherNodeOptions extends NodeOptions {
  alternatives: readonly [Node<any>, Node<any>, ...Node<any>[]];
}

interface EitherParseTreeOptions extends ParseTreeOptions {
  alternativeInputs?: NodeInput[];
}

/** Select by input shape before parsing, so unsuccessful branches have no side effects. */
export class EitherNode<Value = unknown> extends Node<
  NodeGenerics<{ value?: ParsedChild }, ParsedEitherNode<Value>, Value | undefined>
> {
  constructor(options: EitherNodeOptions) {
    super(options);
    options.alternatives.forEach((alternative) => this.addNode(alternative));
  }

  protected createParsedNode(options: ParseTreeOptions): ParsedEitherNode<Value> {
    return new ParsedEitherNode({ definition: this, ...options });
  }

  parse(options: EitherParseTreeOptions): ParsedEitherNode<Value> | null {
    return super.parse(options);
  }

  protected parseChildren({
    parsed,
    options
  }: {
    parsed: ParsedEitherNode<Value>;
    options: EitherParseTreeOptions;
  }): void {
    this.fireListeners((listener) => listener.preChildrenParse?.({ ...options, parsedNode: parsed }));
    if (!options.input) return;
    const { alternativeInputs, ...branchOptions } = options;
    this.parseSelection(parsed, branchOptions, alternativeInputs ?? [options.input]);
  }

  parseChildrenInto({
    parent,
    inputs,
    options,
    selection
  }: {
    parent: ParsedNode;
    inputs: NodeInput[];
    options: ParseTreeOptions;
    selection?: NodeInputSelection;
  }): void {
    const matching = inputs.filter((input) => input.name === this.name);
    if (matching.length <= 1) {
      super.parseChildrenInto({ parent, inputs, options, selection });
      return;
    }
    const parsed = this.parse({
      ...options,
      input: matching[0],
      alternativeInputs: matching,
      parentNode: parent,
      parentEvent: options,
      key: this.options.key
    });
    if (parsed) parent.setChild(this.options.key, parsed);
  }

  private matches(definition: Node<any>, input: NodeInput, repeated: boolean): boolean {
    if (definition.options.isMultiple) return repeated || input.kind === NodeInputKind.ARRAY;
    if (repeated) return false;
    if (definition instanceof EitherNode) {
      return definition.nodes.some((branch) => definition.matches(branch, input, false));
    }
    if (input.kind === NodeInputKind.ELEMENT) return true;
    if (definition instanceof ContentNode) {
      return definition.options.valueType.is(input.content()?.value);
    }
    return input.kind === NodeInputKind.OBJECT;
  }

  private parseSelection(parsed: ParsedEitherNode<Value>, options: ParseTreeOptions, inputs: NodeInput[]): void {
    const input = inputs[0];
    const matches = this.nodes.filter((definition) => this.matches(definition, input, inputs.length > 1));
    if (matches.length !== 1) {
      parsed.pushError({
        source: input.source,
        message:
          matches.length === 0
            ? `No alternative matches '${input.name}' (${input.kind})`
            : `Multiple alternatives match '${input.name}' (${input.kind})`
      });
      return;
    }
    const definition = matches[0];
    if (definition.options.isMultiple) {
      const entries = input.kind === NodeInputKind.ARRAY ? Array.from(input.children()) : inputs;
      const array = new ParsedArrayNode({ definition, key: 'value', inputPresent: true, source: input.source });
      entries.forEach((entry, index) => {
        const child = definition.parseInput({ parent: parsed, options, input: entry, key: String(index) });
        if (child) array.addChild(child);
      });
      parsed.setChild('value', array);
      return;
    }
    const child = definition.parseInput({ parent: parsed, options, input, key: 'value' });
    if (child) parsed.setChild('value', child);
  }
}
