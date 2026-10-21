import { AttributeParseEvent, AttributeParseInput } from '../AttributeParseEvent';
import { XMLParseEvent } from '../XMLParseEvent';
import * as xml from '@journeyapps/common-xml';
import {
  AbstractExpression,
  ExpressionParser,
  ConstantExpression,
  EvaluatedExpression,
  CombinedParser,
  FunctionExpressionParser,
  EvaluatedExpressionParser,
  ConstantExpressionParser
} from '@ja-platform/parser-expressions';
import { Type, textType } from '@ja-platform/parser-type-system';
import { CommonEntity, CommonEntityListener, CommonEntityOptions } from '../entities/CommonEntity';
import { Node } from '../nodes/Node';
import { ParsedAttribute, ParsedAttributeOptions } from '../parsed/ParsedAttribute';
import { ParsedNode } from '../parsed/ParsedNode';

export type CombinedAttributeExpression = EvaluatedExpression | ConstantExpression<unknown>;

export interface AttributeListener extends CommonEntityListener {}

export interface NodeChecker {
  hasAttributeType(type: string): boolean;
}

export interface AttributeOptions<DEFAULT = any, VALUE = unknown> extends CommonEntityOptions {
  /**
   * Accepted expression syntax. Defaults to prefixed code followed by constant text.
   */
  syntax?: ExpressionParser<AbstractExpression>;
  /**
   * Conversion and literal validation for the resolved attribute value.
   */
  valueType?: Type<VALUE>;
  required?: boolean;
  configurable?: boolean;
  advanced?: boolean;
  fragmentNamespace?: string;

  defaultValue?: DEFAULT;
  /**
   * The interim value to use when the component attribute is still being evaluated (ie. setting up watches),
   * will fallback to `defaultValue` if not set.
   */
  loadingValue?: DEFAULT;
  /**
   * By default autowatch is enabled, disable it if the attribute relies on parameters such as $object
   * (used quite often in query-widget) which need to have watches setup in virtual tables
   * @deprecated
   */
  autoWatch?: boolean;
  /**
   * Indicates that the attribute is considered deprecated
   */
  deprecated?: boolean;
  /**
   * Ensures that functions returned by this attribute will be mapped to string identifiers in the runtime
   */
  mapGeneratedFunctions?: boolean;
}

export interface AttributeGenerics<O extends AttributeOptions = AttributeOptions> {
  Options: O;
  Listener: AttributeListener;
  Value: any;
  NormalizedValue: unknown;
}

export interface StringifyDirective {
  isAttribute: boolean;
  value: string | null;
}

export class Attribute<G extends AttributeGenerics = AttributeGenerics> extends CommonEntity<G> {
  static TYPE = 'base-attribute';
  parent: Node<any>;
  type: string;

  constructor(type: string, options: G['Options']) {
    super({
      ...options,
      syntax:
        options.syntax ??
        new CombinedParser<CombinedAttributeExpression>([
          new FunctionExpressionParser(),
          new EvaluatedExpressionParser(),
          new ConstantExpressionParser(options.valueType ?? textType)
        ]),
      autoWatch: options.autoWatch ?? true,
      configurable: options.configurable ?? false,
      advanced: options.advanced ?? false
    });
    this.type = type;
  }

  get key() {
    return this.options.key;
  }

  get defaultValue() {
    return this.options.defaultValue;
  }

  get name() {
    return this.options.name;
  }

  normalizeValue(value: unknown): G['NormalizedValue'] {
    return (this.options.valueType ? this.options.valueType.parse(value) : value) as G['NormalizedValue'];
  }

  isEnclosedWith(checkerCB: (helper: NodeChecker) => boolean) {
    let node: Node = this.parent;

    const checker: NodeChecker = {
      hasAttributeType(type: string): boolean {
        for (let attr of node.attributes) {
          if (attr.constructor.name === type) {
            return true;
          }
        }
      }
    };
    // keep checking the parent
    do {
      if (checkerCB(checker)) {
        return true;
      }

      node = node.parent;
    } while (!!node);
    return false;
  }

  serialize(): any {
    return {
      ...super.serialize(),
      required: this.options.required,
      defaultValue: this.options.defaultValue,

      docs: this.options.docs,
      type: 'standard',
      advanced: !!this.options.advanced
    };
  }

  protected getParsedValue(event: AttributeParseEvent, _parseContext?: Record<string, any>): G['Value'] {
    return (
      event.helper.parseAttributeExpression?.({ attribute: this, source: event.input.value }) ??
      this.options.syntax.parse(event.input.value)
    );
  }

  stringify(value: G['Value'], parent: ParsedNode): StringifyDirective {
    if (value == null) {
      return {
        isAttribute: true,
        value: null
      };
    }

    return {
      isAttribute: true,
      value: value.raw()
    };
  }

  createParsedAttribute(options: ParsedAttributeOptions<G['Value'], this>): ParsedAttribute<G['Value'], this> {
    return new ParsedAttribute(options);
  }

  protected getInput(event: XMLParseEvent<ParsedNode>): AttributeParseInput {
    return {
      value: event.element == null ? null : xml.getAttribute(event.element, this.options.name),
      source: event.element == null ? null : (xml.attributeNode(event.element, this.options.name) ?? event.element)
    };
  }

  parse(event: XMLParseEvent<ParsedNode>, parseContext: Record<string, any> = {}) {
    const input = this.getInput(event);
    let expression: G['Value'] = null;
    let failure: SyntaxError;
    try {
      if (input.value != null) {
        expression = this.getParsedValue({ ...event, input: { ...input, value: input.value } }, parseContext);
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
      failure = error;
    }

    const parsedAttribute = this.createParsedAttribute({
      definition: this,
      event,
      expression,
      parseContext
    });

    if (failure) {
      parsedAttribute.pushError({ message: failure.message, element: input.source });
    }
    return parsedAttribute;
  }
}
