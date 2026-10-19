import { XMLParseEvent } from '../XMLParseEvent';
import * as xml from '@journeyapps/common-xml';
import { XMLElement } from '@journeyapps/domparser/lib';
import * as _ from 'lodash';
import { V5Attribute } from '../attributes/V5Attribute';
import { V5ContentTextAttribute } from '../attributes/V5ContentTextAttribute';
import { V5CommonEntity, V5CommonEntityGenerics, V5CommonEntityOptions } from '../entities/V5CommonEntity';
import { ParsedArrayNode } from '../parsed/ParsedArrayNode';
import { ParsedNode } from '../parsed/ParsedNode';
import { ParsedNodeShape } from '../parsed/ParsedNodeTypes';
import { AbstractValueProvider } from '../values/AbstractValueProvider';
import type { NodeValidationContext } from '../parsed/ParsedNode';

export interface V5NodeListener<Shape extends ParsedNodeShape = ParsedNodeShape> {
  /**
   * before the node is parsed
   */
  preParse?({ event, parentEvent }: { event: XMLParseEvent<ParsedNode>; parentEvent: XMLParseEvent<ParsedNode> }): any;

  /**
   * Before child elements are parsed.
   */
  preChildrenParse?(event: XMLParseEvent<ParsedNode>): void;

  /**
   * Once this node has been parsed
   */
  postParse?({ parsed, parentEvent }: { parsed: ParsedNode<Shape>; parentEvent: XMLParseEvent<ParsedNode> }): any;
}

/**
 * Represents a template for a node
 */
export interface V5Template {
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

export interface V5NodeOptions extends V5CommonEntityOptions {
  isMultiple?: boolean;
  defaultValue?: unknown;
  isRequired?: boolean;
  templates?: V5Template[];
}

export interface V5NodeGenerics<
  Shape extends ParsedNodeShape = ParsedNodeShape,
  Parsed extends ParsedNode<Shape, any> = ParsedNode<Shape>,
  Value = unknown
> extends V5CommonEntityGenerics {
  Shape: Shape;
  Parsed: Parsed;
  Value: Value;
  Options: V5NodeOptions;
  Listener: V5NodeListener<Shape>;
}

export interface ParseTreeOptions {
  event: XMLParseEvent<ParsedNode>;
  parentEvent?: XMLParseEvent<ParsedNode>;
  key?: string;
  valueProviders?: readonly AbstractValueProvider[];
}

export class V5Node<G extends V5NodeGenerics<any> = V5NodeGenerics<any>> extends V5CommonEntity<G> {
  attributes: V5Attribute[];
  nodes: V5Node<any>[];

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

  getNodes(name: string): V5Node<any>[] {
    return this.nodes.filter((n) => n.name == name);
  }

  getNode(name: string): V5Node<any> {
    for (let node of this.nodes) {
      if (node.name === name) {
        return node;
      }
    }
  }

  getAttribute(name: string): V5Attribute {
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

  getContentAttribute(): V5ContentTextAttribute | null {
    return this.attributes.find((attr) => {
      return attr instanceof V5ContentTextAttribute;
    }) as V5ContentTextAttribute;
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

  addAttributes(attrs: V5Attribute[]) {
    attrs.forEach((a) => this.addAttribute(a));
  }

  addAttribute(attribute: V5Attribute): V5Node<G> {
    if (this.attributes.find((x) => x.name === attribute.name)) {
      this.replaceAttribute(attribute);
    } else {
      this.attributes.push(attribute);
      attribute.setParent(this);
    }

    return this;
  }

  replaceAttribute(attribute: V5Attribute): V5Node<G> {
    const index = this.attributes.findIndex((attr) => attr.name === attribute.name);
    if (index === -1) {
      return;
    }

    this.attributes[index] = attribute;
    attribute.setParent(this);
    return this;
  }

  addNode(node: V5Node<any>): V5Node<G> {
    this.nodes.push(node);
    node.setParent(this);
    return this;
  }

  registerListener(listener: V5NodeListener<G['Shape']>) {
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
      listener.preParse?.({ event: options.event, parentEvent: options.parentEvent });
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
    parentEvent?: XMLParseEvent<ParsedNode>;
  }): void {
    this.fireListeners((listener) => listener.postParse?.({ parsed, parentEvent }));
  }

  protected shouldParse(_options: ParseTreeOptions): boolean {
    return true;
  }

  protected createParsedNode(options: ParseTreeOptions): G['Parsed'] {
    return new ParsedNode<G['Shape'], G['Value']>({
      definition: this,
      event: options.event,
      key: options.key,
      valueProviders: options.valueProviders
    }) as G['Parsed'];
  }

  protected buildParsedNode({
    parsed,
    options
  }: {
    parsed: ParsedNode<G['Shape'], G['Value']>;
    options: ParseTreeOptions;
  }): void {
    this.parseAttributes({ parsed, event: options.event });
    options.event.helper.prepareNode?.(parsed);
    this.parseChildren({ parsed, options });
  }

  protected parseAttributes({
    parsed,
    event
  }: {
    parsed: ParsedNode<G['Shape'], G['Value']>;
    event: XMLParseEvent<ParsedNode>;
  }): void {
    const parseContext: Record<string, any> = {};

    this.attributes.forEach((definition: V5Attribute) => {
      try {
        parsed.setAttribute(definition.parse(event, parseContext));
      } catch (ex) {
        parsed.pushError({
          message: `failed to parse attribute: ${definition.options.name} on node ${this.options.name}`
        });
        console.error(`failed to parse attribute: ${definition.options.name} on node ${this.options.name}`, ex);
      }
    });

    parsed.setContent(parseContext['_content']);
  }

  protected parseChildren({
    parsed,
    options
  }: {
    parsed: ParsedNode<G['Shape'], G['Value']>;
    options: ParseTreeOptions;
  }): void {
    const event = options.event;
    this.fireListeners((listener) => listener.preChildrenParse?.({ ...event, parsedNode: parsed }));

    const childElements = xml.children(event.element);

    this.nodes.forEach((definition) => {
      definition.parseChildrenInto({ parent: parsed, elements: childElements, options });
    });
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
    const matchingElements = elements.filter((element) => element.tagName === this.options.name);
    parent.registerListener({
      postValidation: ({ context }) => {
        this.validateChildElementCount({ context, definition: this, matchingElements });
      }
    });

    if (this.options.isMultiple) {
      const arrayNode = new ParsedArrayNode({
        definition: this,
        key: this.options.key
      });

      matchingElements.forEach((element, index) => {
        const child = this.parseElement({ parent, options, element, key: `${index}` });
        if (child) {
          arrayNode.addChild(child);
        }
      });

      parent.setChild(this.options.key, arrayNode);
      return;
    }

    for (const element of matchingElements) {
      const child = this.parseElement({ parent, options, element, key: this.options.key });
      if (child) {
        parent.setChild(this.options.key, child);
        return;
      }
    }
  }

  parseElement({
    parent,
    options,
    element,
    key
  }: {
    parent: ParsedNode;
    options: ParseTreeOptions;
    element: XMLElement;
    key: string;
  }): ParsedNode | null {
    return this.parse({
      event: {
        ...options.event,
        element,
        parentNode: parent
      },
      key,
      valueProviders: parent.parsedValueProviders ?? options.valueProviders
    });
  }

  protected validateChildElementCount({
    context,
    definition,
    matchingElements
  }: {
    context: NodeValidationContext;
    definition: V5Node<any>;
    matchingElements: XMLElement[];
  }): void {
    if (definition.options.isRequired) {
      if (!definition.options.isMultiple && matchingElements.length !== 1) {
        context.report({ message: `<${this.options.name}> must contain exactly one '<${definition.options.name}/>'` });
      }

      if (definition.options.isMultiple && matchingElements.length === 0) {
        context.report({ message: `<${this.options.name}> must contain at least one '<${definition.options.name}/>'` });
      }
    } else if (!definition.options.isMultiple && matchingElements.length > 1) {
      context.report({
        message: `<${this.options.name}> cannot contain more than one '<${definition.options.name}/>'`
      });
    }
  }
}
