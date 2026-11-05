import { AttributeInputKind } from '../input/AttributeInput';
import type { NodeInput } from '../input/NodeInput';
import type { AttributeInput } from '../input/AttributeInput';
import type { AttributeParseContext } from '../input/AttributeParseContext';
import { AttributeParseEvent } from '../AttributeParseEvent';
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

  protected getParsedValue(event: AttributeParseEvent): G['Value'] {
    return (
      event.context?.parseAttributeExpression?.({ attribute: this, source: event.input.value }) ??
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

  protected getInput(node?: NodeInput): AttributeInput | undefined {
    return node?.attribute(this.name);
  }

  parse(node?: NodeInput, context?: AttributeParseContext) {
    return this.parseInput(this.getInput(node), context);
  }

  /** Instantiate an attribute from document input, or from its definition alone. */
  parseInput(input?: AttributeInput, context?: AttributeParseContext) {
    let expression: G['Value'] = null;
    let failure: SyntaxError | undefined;
    try {
      if (input?.kind === AttributeInputKind.LITERAL) {
        const valueType = this.options.valueType;
        if (!valueType) {
          throw new SyntaxError(`Attribute ${this.name} does not support native literal input`);
        }
        expression = new ConstantExpression({
          value: valueType.parse(input.value),
          valueType,
          tokens: [],
          start: input.source?.range.start ?? 0
        });
      } else if (input) {
        expression = this.getParsedValue({ input, context });
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      failure = error;
    }
    const parsed = this.createParsedAttribute({
      definition: this,
      expression,
      input,
      reportError: (diagnostic) => context?.report(diagnostic)
    });
    if (failure) parsed.pushError({ message: failure.message });
    return parsed;
  }
}
