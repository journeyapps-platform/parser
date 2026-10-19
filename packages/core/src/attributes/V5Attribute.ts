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
import { V5CommonEntity, V5CommonEntityListener, V5CommonEntityOptions } from '../entities/V5CommonEntity';
import { V5EditorHelpers } from '../events/V5EditorContext';
import { V5Node } from '../nodes/V5Node';
import { ParsedAttribute, ParsedAttributeOptions, ParsedNode } from '../parsed';

export type CombinedAttributeExpression = EvaluatedExpression | ConstantExpression<unknown>;

export enum DefaultValueKind {
  COLOR = 'color',
  SIZE = 'size'
}

export enum ComponentSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export type DefaultValueMap<T extends any> = { [k in string | number | symbol]: T };

export interface V5AttributeListener extends V5CommonEntityListener {}

export interface NodeChecker {
  hasAttributeType(type: string): boolean;
}

export type DefaultValueType<T> = { [k in ComponentSize]: T } | T;

export enum AttributeCategory {
  THEME = 'theme',
  LAYOUT = 'layout'
}

export interface V5AttributeOptions<DEFAULT = any, VALUE = unknown> extends V5CommonEntityOptions {
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

  /**
   * Used to categorise sets of attributes for easier filtering
   */
  category?: AttributeCategory;
  fragmentNamespace?: string;

  defaultValue?: DEFAULT;
  /**
   * Select a variant contribution explicitly; omitted defaults are literal values.
   */
  defaultValueKind?: DefaultValueKind;
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

export interface V5AttributeGenerics<O extends V5AttributeOptions = V5AttributeOptions> {
  Options: O;
  Listener: V5AttributeListener;
  Value: any;
  NormalizedValue: unknown;
}

export interface StringifyDirective {
  isAttribute: boolean;
  value: string | null;
}

export class V5Attribute<G extends V5AttributeGenerics = V5AttributeGenerics> extends V5CommonEntity<G> {
  static TYPE = 'base-attribute';
  parent: V5Node<any>;
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
    let node: V5Node = this.parent;

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
      defaultValueKind: this.options.defaultValueKind,
      docs: this.options.docs,
      type: 'standard',
      advanced: !!this.options.advanced
    };
  }
  getEditorV5Syntax<T>(helpers: V5EditorHelpers<T>): T {
    return helpers.viewFunctionsSelection();
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
