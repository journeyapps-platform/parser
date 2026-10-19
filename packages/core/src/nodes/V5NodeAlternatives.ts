import { ParsedArrayNode, ParsedNode, ParsedNodeShape } from '../parsed';
import { ParseTreeOptions, V5Node, V5NodeGenerics, V5NodeOptions } from './V5Node';
import { XMLElement } from '@journeyapps/domparser/lib';
import type { NodeValidationContext } from '../parsed/ParsedNode';

export interface V5NodeAlternativesOptions extends Omit<V5NodeOptions, 'name'> {
  key: string;
  alternatives: V5Node<any>[];
  exclusive?: boolean;
}

export class V5NodeAlternatives<Shape extends ParsedNodeShape = ParsedNodeShape> extends V5Node<V5NodeGenerics<Shape>> {
  private readonly exclusiveValue: boolean;
  private readonly alternatives: V5Node<any>[];

  constructor(options: V5NodeAlternativesOptions) {
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
    elements,
    options
  }: {
    parent: ParsedNode;
    elements: XMLElement[];
    options: ParseTreeOptions;
  }): void {
    const matchingElements = elements.filter((element) => this.getMatchingAlternatives(element).length > 0);
    parent.registerListener({
      postValidation: ({ context }) => {
        this.validateAlternativeCount({ parent, matchingElements, context });
      }
    });

    const arrayNode = new ParsedArrayNode({
      definition: this,
      key: this.options.key
    });

    matchingElements.forEach((element, index) => {
      const childKey = this.options.isMultiple ? `${index}` : this.options.key;
      const parsedChild = this.parseAlternativeElement({
        parent,
        options,
        element,
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

  private parseAlternativeElement({
    parent,
    options,
    element,
    key
  }: {
    parent: ParsedNode;
    options: ParseTreeOptions;
    element: XMLElement;
    key: string;
  }): ParsedNode | ParsedArrayNode | null {
    for (const definition of this.getMatchingAlternatives(element)) {
      const child = definition.parseElement({ parent, options, element, key });
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

  private getMatchingAlternatives(element: XMLElement): V5Node<any>[] {
    return this.alternatives.filter((alternative) => alternative.options.name === element.tagName);
  }

  private validateAlternativeCount({
    parent,
    matchingElements,
    context
  }: {
    parent: ParsedNode;
    matchingElements: XMLElement[];
    context: NodeValidationContext;
  }): void {
    if (this.options.isRequired && matchingElements.length === 0) {
      context.report({
        message: `<${parent.definition.options.name}> must contain at least one '${this.options.key}' child`
      });
      return;
    }

    if (this.exclusive && matchingElements.length > 1) {
      context.report({
        message: `<${parent.definition.options.name}> can only contain one '${this.options.key}' child`
      });
      return;
    }

    this.nodes.forEach((definition) => {
      const matchingDefinitionElements = matchingElements.filter((element) =>
        this.getMatchingAlternatives(element).some((alternative) => alternative === definition)
      );
      this.validateDefinitionCount({
        parent,
        definition,
        matchingElements: matchingDefinitionElements,
        context
      });
    });
  }

  private validateDefinitionCount({
    parent,
    definition,
    matchingElements,
    context
  }: {
    parent: ParsedNode;
    definition: V5Node;
    matchingElements: XMLElement[];
    context: NodeValidationContext;
  }): void {
    if (definition.options.isRequired) {
      if (!definition.options.isMultiple && matchingElements.length !== 1) {
        context.report({
          message: `<${parent.definition.options.name}> must contain exactly one '<${definition.options.name}/>'`
        });
      }

      if (definition.options.isMultiple && matchingElements.length === 0) {
        context.report({
          message: `<${parent.definition.options.name}> must contain at least one '<${definition.options.name}/>'`
        });
      }
    } else if (!definition.options.isMultiple && matchingElements.length > 1) {
      context.report({
        message: `<${parent.definition.options.name}> cannot contain more than one '<${definition.options.name}/>'`
      });
    }
  }

  parse(_options: ParseTreeOptions): ParsedNode<Shape> | null {
    return null;
  }
}
