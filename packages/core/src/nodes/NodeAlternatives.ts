import { ParsedArrayNode } from '../parsed/ParsedArrayNode';
import { ParsedNode } from '../parsed/ParsedNode';
import { ParsedNodeShape } from '../parsed/ParsedNodeTypes';
import { ParseTreeOptions, Node, NodeGenerics, NodeOptions } from './Node';
import type { NodeInput } from '../input/NodeInput';
import type { NodeValidationContext } from '../parsed/ParsedNode';

export interface NodeAlternativesOptions extends Omit<NodeOptions, 'name'> {
  key: string;
  alternatives: Node<any>[];
  exclusive?: boolean;
}

export class NodeAlternatives<Shape extends ParsedNodeShape = ParsedNodeShape> extends Node<NodeGenerics<Shape>> {
  private readonly exclusiveValue: boolean;
  private readonly alternatives: Node<any>[];

  constructor(options: NodeAlternativesOptions) {
    super({
      ...options,
      name: options.key,
      isMultiple: options.alternatives.some((alternative) => alternative.options.isMultiple)
    });
    this.exclusiveValue = options.exclusive ?? false;
    this.alternatives = options.alternatives;

    this.alternatives.forEach((alternative) => {
      alternative.options.key = options.key;
      this.addNode(alternative);
    });
  }

  get exclusive(): boolean {
    return this.exclusiveValue;
  }

  parseChildrenInto({
    parent,
    inputs,
    options
  }: {
    parent: ParsedNode;
    inputs: NodeInput[];
    options: ParseTreeOptions;
  }): void {
    const matchingInputs = inputs.filter((input) => this.getMatchingAlternatives(input).length > 0);
    parent.registerListener({
      postValidation: ({ context }) => {
        this.validateAlternativeCount({ parent, matchingInputs, context });
      }
    });

    const arrayNode = new ParsedArrayNode({
      definition: this,
      key: this.options.key
    });

    matchingInputs.forEach((input, index) => {
      const childKey = this.options.isMultiple ? `${index}` : this.options.key;
      const parsedChild = this.parseAlternativeInput({
        parent,
        options,
        input,
        key: childKey
      });
      if (parsedChild) {
        arrayNode.addChild(parsedChild);
      }
    });

    if (this.options.isMultiple) {
      parent.setChild(this.options.key, arrayNode);
      return;
    }

    const firstNode = arrayNode.at(0);
    if (firstNode) {
      parent.setChild(this.options.key, firstNode);
    }
  }

  private parseAlternativeInput({
    parent,
    options,
    input,
    key
  }: {
    parent: ParsedNode;
    options: ParseTreeOptions;
    input: NodeInput;
    key: string;
  }): ParsedNode | ParsedArrayNode | null {
    for (const definition of this.getMatchingAlternatives(input)) {
      const child = definition.parseInput({ parent, options, input, key });
      if (child) {
        if (definition.options.isMultiple) {
          const arrayNode = new ParsedArrayNode({
            definition,
            key
          });
          arrayNode.addChild(child);
          return arrayNode;
        }

        return child;
      }
    }

    return null;
  }

  private getMatchingAlternatives(input: NodeInput): Node<any>[] {
    return this.alternatives.filter((alternative) => alternative.options.name === input.name);
  }

  private validateAlternativeCount({
    parent,
    matchingInputs,
    context
  }: {
    parent: ParsedNode;
    matchingInputs: NodeInput[];
    context: NodeValidationContext;
  }): void {
    if (this.options.isRequired && matchingInputs.length === 0) {
      context.report({
        message: `<${parent.definition.options.name}> must contain at least one '${this.options.key}' child`
      });
      return;
    }

    if (this.exclusive && matchingInputs.length > 1) {
      context.report({
        message: `<${parent.definition.options.name}> can only contain one '${this.options.key}' child`
      });
      return;
    }

    this.nodes.forEach((definition) => {
      const matchingDefinitionInputs = matchingInputs.filter((input) =>
        this.getMatchingAlternatives(input).some((alternative) => alternative === definition)
      );
      this.validateDefinitionCount({
        parent,
        definition,
        matchingInputs: matchingDefinitionInputs,
        context
      });
    });
  }

  private validateDefinitionCount({
    parent,
    definition,
    matchingInputs,
    context
  }: {
    parent: ParsedNode;
    definition: Node;
    matchingInputs: NodeInput[];
    context: NodeValidationContext;
  }): void {
    if (definition.options.isRequired) {
      if (!definition.options.isMultiple && matchingInputs.length !== 1) {
        context.report({
          message: `<${parent.definition.options.name}> must contain exactly one '<${definition.options.name}/>'`
        });
      }

      if (definition.options.isMultiple && matchingInputs.length === 0) {
        context.report({
          message: `<${parent.definition.options.name}> must contain at least one '<${definition.options.name}/>'`
        });
      }
    } else if (!definition.options.isMultiple && matchingInputs.length > 1) {
      context.report({
        message: `<${parent.definition.options.name}> cannot contain more than one '<${definition.options.name}/>'`
      });
    }
  }

  parse(_options: ParseTreeOptions): ParsedNode<Shape> | null {
    return null;
  }
}
