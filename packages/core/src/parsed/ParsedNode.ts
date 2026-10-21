import { ParsedNodeValues, ParsedNodeValuesLike } from '../values/ParsedNodeValues';
import { TreeNode, TreeNodeListener } from '@journeyapps/common-tree';
import { XMLParseEvent } from '../XMLParseEvent';

import { XMLElement } from '@journeyapps/domparser/lib';
import { Node } from '../nodes/Node';
import { ParsedArrayNode } from './ParsedArrayNode';
import { ParsedAttribute } from './ParsedAttribute';
import { ParsedDiagnostic, ParsedDiagnosticStore, ParsedValidationDiagnostic } from './ParsedDiagnostic';
import type { ValidationContext } from '@ja-platform/parser-expressions';
import {
  ParsedChild,
  ParsedChildNamesMarker,
  ParsedNodeAttribute,
  ParsedNodeAttributeShape,
  ParsedNodeAttributeName,
  ParsedNodeChild,
  ParsedNodeExpressionKey,
  ParsedNodeKnownChildKey,
  ParsedNodeValue,
  ParsedNodeValueRequest,
  ParsedNodeValueRequestKey,
  ParsedNodeRequiredAttributeName,
  ParsedNodeShape,
  ParsedNodeUntypedExpressionKey
} from './ParsedNodeTypes';
import { ParsedValue } from '../values/ParsedValue';
import { AbstractValueProvider } from '../values/AbstractValueProvider';

export interface ParsedNodeOptions {
  definition: Node<any>;
  event: XMLParseEvent<ParsedNode>;
  key?: string;
  valueProviders?: readonly AbstractValueProvider[];
}

export interface ParsedNodeValidationContext {
  scope: ValidationContext;
}

export interface NodeValidationEvent<Shape extends ParsedNodeShape = ParsedNodeShape, Value = ParsedNodeValue<Shape>> {
  node: ParsedNode<Shape, Value>;
  context: NodeValidationContext;
}

export interface NodeValidationContext {
  readonly scope: ValidationContext;
  report(diagnostic: ParsedValidationDiagnostic): void;
}

export interface ParsedNodeListener<
  Shape extends ParsedNodeShape = ParsedNodeShape,
  Value = ParsedNodeValue<Shape>
> extends TreeNodeListener {
  /**
   * Report diagnostics and introduce child scopes before validating expressions and descendants.
   * Hooks run in registration order during explicit validation, independently of parsing.
   */
  preValidation?(event: NodeValidationEvent<Shape, Value>): void;

  /**
   * Validate this node after its expressions and descendants using the resulting context.
   */
  postValidation?(event: NodeValidationEvent<Shape, Value>): void;
}

export class ParsedNode<T extends ParsedNodeShape = ParsedNodeShape, Value = ParsedNodeValue<T>> extends TreeNode<
  ParsedNodeListener<any, any>
> {
  private readonly parsedValues = new Map<ParsedAttribute, ParsedValue<any>>();
  private attributesByKey: Map<string, ParsedAttribute> = new Map();
  private childrenByKey: Map<string, ParsedChild> = new Map();
  private valueProviders?: readonly AbstractValueProvider[];
  public readonly definition: Node<any>;
  public readonly sourceElement: XMLElement;
  public readonly parseParentNode?: ParsedNode;
  private parsedContent: any;
  private readonly diagnostics = new ParsedDiagnosticStore();
  private readonly reportError: (diagnostic: ParsedDiagnostic) => void;

  constructor(options: ParsedNodeOptions) {
    const definition = options.definition;
    super(options.key ?? definition.options.key);
    this.definition = definition;
    this.sourceElement = options.event.element;
    this.parseParentNode = options.event.parentNode;
    this.reportError = options.event.helper.pushError;
    if (options.valueProviders) {
      this.valueProviders = Object.freeze([...options.valueProviders]);
    }
  }

  get type(): string {
    return this.attribute('type')?.expression()?.value() ?? this.definition.options.name;
  }

  registerListener(listener: Partial<ParsedNodeListener<T, Value>>): () => void {
    return super.registerListener(listener);
  }

  get children(): ParsedNode[] {
    return this.nodes();
  }

  getRoot(): ParsedNode {
    const parent = this.getParent<ParsedNode>() ?? this.parseParentNode;
    return parent?.getRoot() ?? this;
  }

  get parsedValueProviders(): readonly AbstractValueProvider[] | undefined {
    return this.valueProviders;
  }

  setValueProviders(providers: readonly AbstractValueProvider[]): this {
    this.parsedValues.clear();
    this.valueProviders = Object.freeze([...providers]);
    this.childEntries().forEach((child) => child.setValueProviders(providers));
    return this;
  }

  value<const Keys extends readonly ParsedNodeValueRequestKey<T, Value>[]>(
    attributes: Keys
  ): ParsedNodeValuesLike<ParsedNodeValueRequest<T, Value, Keys>>;
  value<RequestedValue = any>(
    attributes: readonly ParsedNodeUntypedExpressionKey<T>[]
  ): ParsedNodeValuesLike<RequestedValue>;
  value(attributeKeys: readonly string[]): ParsedNodeValuesLike<any> {
    const attributes = this.collectAttributeValues(attributeKeys);
    return new ParsedNodeValues(
      attributes.map(([, source]) => source),
      (currentValues) =>
        Object.fromEntries(
          attributes.flatMap(([key], index) =>
            currentValues[index] === undefined ? [] : [[key, currentValues[index]]]
          )
        )
    );
  }

  /**
   * Resolve this node's attributes and descendants through their value providers.
   * Include declared defaults for absent children without creating parsed nodes.
   */
  valueTree(): ParsedNodeValuesLike<Value> {
    const defaults = this.definition.nodes.flatMap(({ options, defaultValue }) =>
      !this.childrenByKey.has(options.key) && defaultValue !== undefined ? [[options.key, defaultValue]] : []
    );
    const attributes = this.collectAttributeValues(this.attributes().map((attribute) => attribute.getKey()));
    const sources: Array<readonly [string, ParsedNodeValuesLike<unknown>]> = [...attributes];
    for (const [key, child] of this.childrenByKey) {
      sources.push([key, child.valueTree()]);
    }
    return new ParsedNodeValues<Value>(
      sources.map(([, source]) => source),
      (currentValues) =>
        Object.fromEntries([
          ...defaults,
          ...sources.flatMap(([key], index) =>
            index < attributes.length && currentValues[index] === undefined ? [] : [[key, currentValues[index]]]
          )
        ]) as Value
    );
  }

  /**
   * Collect retained attribute sources for a value container to own and release.
   */
  protected collectAttributeValues(attributeKeys: readonly string[]): Array<readonly [string, ParsedValue<unknown>]> {
    if (!this.valueProviders) {
      throw new Error(`No value providers have been configured for parsed node '${this.getKey()}'`);
    }
    const attributes = attributeKeys.map((key) => {
      const attribute = this.attribute(key);
      if (!attribute) {
        throw new Error(`Unknown parsed attribute '${key}' on node '${this.getKey()}'`);
      }
      return attribute;
    });
    const sources: Array<readonly [string, ParsedValue<unknown>]> = [];
    for (const attribute of attributes) {
      sources.push([attribute.getKey(), this.getParsedValue(attribute).retain()]);
    }
    return sources;
  }

  attribute<Key extends Extract<ParsedNodeRequiredAttributeName<T>, ParsedNodeExpressionKey<T>>>(
    key: Key
  ): ParsedNodeAttribute<T, Key>;
  attribute<Key extends Exclude<ParsedNodeExpressionKey<T>, ParsedNodeRequiredAttributeName<T>>>(
    key: Key
  ): ParsedNodeAttribute<T, Key> | undefined;
  attribute<Attribute extends ParsedAttribute = ParsedAttribute>(key: string): Attribute | undefined;
  attribute(key: string): ParsedAttribute | undefined {
    return this.attributesByKey.get(key);
  }

  attrExpression<Key extends ParsedNodeExpressionKey<T>>(key: Key): ParsedNodeAttributeShape<T>[Key] | undefined;
  attrExpression<Value = any>(key: ParsedNodeUntypedExpressionKey<T>): Value | undefined;
  attrExpression(key: string): any {
    return this.attributesByKey.get(key)?.expression();
  }

  attributes(): ParsedAttribute[];
  attributes<const Names extends readonly ParsedNodeAttributeName<T>[]>(names: Names): ParsedAttribute[];
  attributes(names?: readonly string[]): ParsedAttribute[] {
    const attributes = Array.from(this.attributesByKey.values());
    if (!names || names.length === 0) {
      return attributes;
    }

    return attributes.filter((attribute) => names.includes(attribute.name));
  }

  content() {
    return this.parsedContent;
  }

  setContent(content: any): this {
    this.parsedContent = content;
    return this;
  }

  /**
   * Validate attribute expressions and descendants against the supplied scope.
   * Diagnostics are returned without changing parse errors or reading values.
   */
  validate({ scope }: ParsedNodeValidationContext): ParsedValidationDiagnostic[] {
    const diagnostics: ParsedValidationDiagnostic[] = [];
    const element = this.sourceElement;
    const context: NodeValidationContext = {
      scope,
      report(diagnostic) {
        diagnostics.push(diagnostic.token ? diagnostic : { ...diagnostic, element: diagnostic.element ?? element });
      }
    };
    this.iterateListeners((listener) => listener.preValidation?.({ node: this, context }));
    diagnostics.push(
      ...this.attributes().flatMap(
        (attribute) =>
          attribute
            .expression()
            ?.validate(scope)
            .map((diagnostic) => ({ ...diagnostic, element })) ?? []
      ),
      ...this.nodes().flatMap((child) => child.validate({ scope }))
    );
    this.iterateListeners((listener) => listener.postValidation?.({ node: this, context }));
    return diagnostics;
  }

  pushError({ message, element = this.sourceElement, type }: ParsedDiagnostic): ParsedDiagnostic {
    const diagnostic = this.diagnostics.pushError({ message, element, type });
    this.reportError({ element, message, type });
    return diagnostic;
  }

  reportDiagnostic(diagnostic: ParsedDiagnostic) {
    this.reportError(diagnostic);
  }

  errors(options: { deep?: boolean } = {}): ParsedDiagnostic[] {
    if (!options.deep) {
      return this.diagnostics.errors();
    }

    return [
      ...this.diagnostics.errors(),
      ...this.attributes().flatMap((attribute) => attribute.errors()),
      ...this.childEntries().flatMap((child) => {
        if (child instanceof ParsedArrayNode) {
          return [...child.errors(), ...child.nodes().flatMap((node) => node.errors({ deep: true }))];
        }
        return child.errors({ deep: true });
      })
    ];
  }

  hasErrors(options: { deep?: boolean } = {}): boolean {
    return this.errors(options).length > 0;
  }

  child(key: string): ParsedChild | undefined {
    return this.childrenByKey.get(key);
  }

  setChild(key: string, child: ParsedChild): this {
    const existing = this.childrenByKey.get(key);
    if (existing && existing !== child) {
      existing.delete();
    }

    this.childrenByKey.set(key, child);

    this.addParsedChild(child);

    if (this.valueProviders) {
      child.setValueProviders(this.valueProviders);
    }

    return this;
  }

  removeChild(key: string): this {
    const child = this.childrenByKey.get(key);
    this.childrenByKey.delete(key);
    child?.delete();
    return this;
  }

  setAttribute(attribute: ParsedAttribute): this {
    const previous = this.attributesByKey.get(attribute.definition.options.key);
    this.parsedValues.delete(previous);
    this.attributesByKey.set(attribute.definition.options.key, attribute);
    this.addParsedAttribute(attribute);
    return this;
  }

  node<Key extends ParsedNodeKnownChildKey<T>>(key: Key): ParsedNodeChild<T, Key> | undefined;
  node<Child extends ParsedChild = ParsedChild>(
    key: T extends ParsedChildNamesMarker<any> ? never : string
  ): Child | undefined;
  node(key: string): ParsedChild | undefined {
    return this.child(key);
  }

  childEntries(): ParsedChild[] {
    return Array.from(this.childrenByKey.values());
  }

  nodes(): ParsedNode[] {
    return this.childEntries().flatMap((child) => {
      if (child instanceof ParsedArrayNode) {
        return this.flattenParsedArray(child);
      }
      return [child];
    });
  }

  private flattenParsedArray(arrayNode: ParsedArrayNode): ParsedNode[] {
    return arrayNode.nodes().flatMap((child) => {
      if (child instanceof ParsedArrayNode) {
        return this.flattenParsedArray(child);
      }
      return [child];
    });
  }

  private getParsedValue(attribute: ParsedAttribute): ParsedValue<any> {
    let value = this.parsedValues.get(attribute);
    if (!value) {
      value = new ParsedValue(attribute, this.valueProviders);
      this.parsedValues.set(attribute, value);
      const deregister = value.registerListener({
        disposed: () => {
          deregister();
          if (this.parsedValues.get(attribute) === value) {
            this.parsedValues.delete(attribute);
          }
        }
      });
    }
    return value;
  }

  private addParsedAttribute(attribute: ParsedAttribute) {
    const existing = this.getChild(attribute.getKey());
    if (existing) {
      existing.delete();
    }
    this.addChild(attribute);
  }

  private addParsedChild(child: ParsedChild) {
    const existing = this.getChild(child.getKey());
    if (existing) {
      existing.delete();
    }
    this.addChild(child);
  }
}
