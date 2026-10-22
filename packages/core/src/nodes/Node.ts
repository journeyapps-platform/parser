import { ParseEvent } from '../ParseEvent';
import { AttributeInputLocation } from '../input/AttributeInput';
import type { NodeInput } from '../input/NodeInput';
import * as _ from 'lodash';
import { Attribute } from '../attributes/Attribute';
import { ContentTextAttribute } from '../attributes/ContentTextAttribute';
import { CommonEntity, CommonEntityGenerics, CommonEntityOptions } from '../entities/CommonEntity';
import { ParsedArrayNode } from '../parsed/ParsedArrayNode';
import { ParsedNode } from '../parsed/ParsedNode';
import { ParsedNodeShape } from '../parsed/ParsedNodeTypes';
import type { NodeValidationContext } from '../parsed/ParsedNode';

export interface NodeListener<Shape extends ParsedNodeShape = ParsedNodeShape> {
  /**
   * before the node is parsed
   */
  preParse?({ event, parentEvent }: { event: ParseEvent; parentEvent: ParseEvent }): any;

  /**
   * Before child inputs are parsed.
   */
  preChildrenParse?(event: ParseEvent): void;

  /**
   * Once this node has been parsed
   */
  postParse?({ parsed, parentEvent }: { parsed: ParsedNode<Shape>; parentEvent: ParseEvent }): any;
}

/**
 * Represents a template for a node
 */
export interface NodeTemplate {
  /**
   * Name of the node
   */
  name: string;
  /**
   * The string version of the template
   * @example <table attr1="${cursor}" />
   */
  template?: string;
  /**
   * if `template` is not defined, the attributes to make up the template:
   * @example ['attr1']
   */
  attrs?: string[];
}

export interface NodeOptions extends CommonEntityOptions {
  isMultiple?: boolean;
  defaultValue?: unknown;
  isRequired?: boolean;
  templates?: NodeTemplate[];
}

export interface NodeGenerics<
  Shape extends ParsedNodeShape = ParsedNodeShape,
  Parsed extends ParsedNode<Shape, any> = ParsedNode<Shape>,
  Value = unknown
> extends CommonEntityGenerics {
  Shape: Shape;
  Parsed: Parsed;
  Value: Value;
  Options: NodeOptions;
  Listener: NodeListener<Shape>;
}

export interface ParseTreeOptions extends ParseEvent {
  parentEvent?: ParseEvent;
  key?: string;
}

export class Node<G extends NodeGenerics<any> = NodeGenerics<any>> extends CommonEntity<G> {
  attributes: Attribute[];
  nodes: Node<any>[];

  constructor(options: G['Options']) {
    super({
      ...options,
      // templates should always be an empty array
      templates: options.templates || []
    });

    this.attributes = [];
    this.nodes = [];
    this.listeners = [];
  }

  get name() {
    return this.options.name;
  }

  get defaultValue(): G['Value'] | G['Value'][] | undefined {
    return this.options.defaultValue;
  }

  serialize(): any {
    return {
      ...super.serialize(),
      multiple: this.options.isMultiple,
      required: this.options.isRequired,
      docs: this.options.docs,
      children: this.nodes.map((node) => {
        return node.serialize();
      }),
      attributes: this.attributes.map((attr) => {
        return attr.serialize();
      })
    };
  }

  getNodes(name: string): Node<any>[] {
    return this.nodes.filter((n) => n.name == name);
  }

  getNode(name: string): Node<any> {
    for (let node of this.nodes) {
      if (node.name === name) {
        return node;
      }
    }
  }

  getAttribute(name: string): Attribute {
    for (let attr of this.attributes) {
      if (attr.name === name) {
        return attr;
      }
    }
  }

  removeAttribute(name: string) {
    const index = _.findIndex(this.attributes, (item) => {
      return item.name == name;
    });

    if (index < 0) {
      return this;
    }

    this.attributes.splice(index, 1);
    return this;
  }

  getContentAttribute(): ContentTextAttribute | null {
    return this.attributes.find((attr) => {
      return attr instanceof ContentTextAttribute;
    }) as ContentTextAttribute;
  }

  getTemplate(cursor?: string): { template?: string; templates?: { name: string; template: string }[] } {
    if (cursor == null) {
      cursor = '${cursor}';
    }
    // use the named templates
    if (this.options.templates.length > 0) {
      return {
        templates: this.options.templates.map((template) => {
          if (template.template) {
            return {
              name: template.name,
              template: template.template
            };
          }

          let first = true;
          const attrs = template.attrs.map((attr) => {
            return `${attr}="${first ? cursor : ''}"`;
            first = false;
          });

          return {
            name: template.name,
            template: `<${this.name} ${attrs.join(' ')} />`
          };
        })
      };
    }

    // no children, so put the first attribute
    if (this.nodes.length === 0 && this.attributes.length > 0) {
      return {
        template: `<${this.name} ${this.attributes[0].name}="${cursor}" />`
      };
    }

    // normal node
    return {
      template: `<${this.name}>${cursor}</${this.name}>`
    };
  }

  addAttributes(attrs: Attribute[]) {
    attrs.forEach((a) => this.addAttribute(a));
  }

  addAttribute(attribute: Attribute): Node<G> {
    if (this.attributes.find((x) => x.name === attribute.name)) {
      this.replaceAttribute(attribute);
    } else {
      this.attributes.push(attribute);
      attribute.setParent(this);
    }

    return this;
  }

  replaceAttribute(attribute: Attribute): Node<G> {
    const index = this.attributes.findIndex((attr) => attr.name === attribute.name);
    if (index === -1) {
      return;
    }

    this.attributes[index] = attribute;
    attribute.setParent(this);
    return this;
  }

  addNode(node: Node<any>): Node<G> {
    this.nodes.push(node);
    node.setParent(this);
    return this;
  }

  registerListener(listener: NodeListener<G['Shape']>) {
    return super.registerListener(listener as G['Listener']);
  }

  parse(options: ParseTreeOptions): G['Parsed'] | null {
    if (!this.shouldParse(options)) {
      return null;
    }
    return this.parseTree(options);
  }

  parseTree(options: ParseTreeOptions): G['Parsed'] {
    this.fireListeners((listener) => {
      listener.preParse?.({ event: options, parentEvent: options.parentEvent });
    });

    const result = this.createParsedNode(options);
    this.buildParsedNode({ parsed: result, options });

    this.validateParsedNode({ parsed: result, parentEvent: options.parentEvent });

    return result;
  }

  validateParsedNode({
    parsed,
    parentEvent
  }: {
    parsed: ParsedNode<G['Shape'], G['Value']>;
    parentEvent?: ParseEvent;
  }): void {
    this.fireListeners((listener) => listener.postParse?.({ parsed, parentEvent }));
  }

  protected shouldParse(_options: ParseTreeOptions): boolean {
    return true;
  }

  protected createParsedNode(options: ParseTreeOptions): G['Parsed'] {
    return new ParsedNode<G['Shape'], G['Value']>({
      definition: this,
      ...options
    }) as G['Parsed'];
  }

  protected buildParsedNode({
    parsed,
    options
  }: {
    parsed: ParsedNode<G['Shape'], G['Value']>;
    options: ParseTreeOptions;
  }): void {
    this.parseAttributes({ parsed, event: options });
    options.prepareNode?.(parsed);
    this.parseChildren({ parsed, options });
  }

  protected parseAttributes({
    parsed,
    event
  }: {
    parsed: ParsedNode<G['Shape'], G['Value']>;
    event: ParseEvent;
  }): void {
    this.attributes.forEach((definition: Attribute) => {
      try {
        const attribute = definition.parse(event.input, event);
        parsed.setAttribute(attribute);
        if (attribute.input?.location === AttributeInputLocation.CONTENT) {
          parsed.setContent(attribute.expression());
        }
      } catch (ex) {
        parsed.pushError({
          message: `failed to parse attribute: ${definition.options.name} on node ${this.options.name}`
        });
        console.error(`failed to parse attribute: ${definition.options.name} on node ${this.options.name}`, ex);
      }
    });
  }

  protected parseChildren({
    parsed,
    options
  }: {
    parsed: ParsedNode<G['Shape'], G['Value']>;
    options: ParseTreeOptions;
  }): void {
    const event = options;
    this.fireListeners((listener) => listener.preChildrenParse?.({ ...event, parsedNode: parsed }));

    if (!event.input) return;
    const childInputs = Array.from(event.input.children());

    this.nodes.forEach((definition) => {
      definition.parseChildrenInto({ parent: parsed, inputs: childInputs, options });
    });
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
    const matchingInputs = inputs.filter((input) => input.name === this.options.name);
    parent.registerListener({
      postValidation: ({ context }) => {
        this.validateChildCount({ context, definition: this, matchingInputs });
      }
    });

    if (this.options.isMultiple) {
      const arrayNode = new ParsedArrayNode({
        definition: this,
        key: this.options.key
      });

      matchingInputs.forEach((input, index) => {
        const child = this.parseInput({ parent, options, input, key: `${index}` });
        if (child) {
          arrayNode.addChild(child);
        }
      });

      parent.setChild(this.options.key, arrayNode);
      return;
    }

    for (const input of matchingInputs) {
      const child = this.parseInput({ parent, options, input, key: this.options.key });
      if (child) {
        parent.setChild(this.options.key, child);
        return;
      }
    }
  }

  parseInput({
    parent,
    options,
    input,
    key
  }: {
    parent: ParsedNode;
    options: ParseTreeOptions;
    input: NodeInput;
    key: string;
  }): ParsedNode | null {
    return this.parse({
      ...options,
      input,
      parentNode: parent,
      parentEvent: options,
      key
    });
  }

  protected validateChildCount({
    context,
    definition,
    matchingInputs
  }: {
    context: NodeValidationContext;
    definition: Node<any>;
    matchingInputs: NodeInput[];
  }): void {
    if (definition.options.isRequired) {
      if (!definition.options.isMultiple && matchingInputs.length !== 1) {
        context.report({ message: `<${this.options.name}> must contain exactly one '<${definition.options.name}/>'` });
      }

      if (definition.options.isMultiple && matchingInputs.length === 0) {
        context.report({ message: `<${this.options.name}> must contain at least one '<${definition.options.name}/>'` });
      }
    } else if (!definition.options.isMultiple && matchingInputs.length > 1) {
      context.report({
        message: `<${this.options.name}> cannot contain more than one '<${definition.options.name}/>'`
      });
    }
  }
}
