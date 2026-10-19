import { AttributeParseEvent } from '../AttributeParseEvent';
import { fanDefaultValue } from './AttributeDefaults';
import {
  DefaultValueType,
  DefaultValueKind,
  V5Attribute,
  V5AttributeGenerics,
  V5AttributeOptions
} from './V5Attribute';
import { V5EditorHelpers } from '../events/V5EditorContext';
import {
  FormatStringExpression,
  CombinedParser,
  FunctionExpressionParser,
  EvaluatedExpressionParser,
  FormatStringExpressionParser,
  EvaluatedExpression
} from '@ja-platform/parser-expressions';
import { textType } from '@ja-platform/parser-type-system';

export type CombinedTextExpression = FormatStringExpression | EvaluatedExpression;

export type V5TextAttributeOptions<Value = string> = V5AttributeOptions<DefaultValueType<Value>, Value>;

export interface V5TextAttributeGenerics<Value = string> extends V5AttributeGenerics {
  Value: CombinedTextExpression | null;
  Options: V5TextAttributeOptions<Value>;
  NormalizedValue: Value;
}

export class V5TextAttribute<
  T extends V5TextAttributeGenerics<unknown> = V5TextAttributeGenerics
> extends V5Attribute<T> {
  static TYPE = 'text-attribute';

  constructor(options: T['Options']) {
    super(V5TextAttribute.TYPE, {
      ...options,
      valueType: options.valueType ?? textType,
      syntax:
        options.syntax ??
        new CombinedParser<CombinedTextExpression>([
          new FunctionExpressionParser(),
          new EvaluatedExpressionParser(),
          new FormatStringExpressionParser()
        ]),
      defaultValueKind: DefaultValueKind.SIZE,
      configurable: options.configurable ?? true
    });
    if (typeof this.options.defaultValue === 'string') {
      this.options.defaultValue = fanDefaultValue(this.options.defaultValue);
    }
  }

  static isInstanceOf(attr: V5Attribute): attr is V5TextAttribute<V5TextAttributeGenerics<unknown>> {
    return attr.type === V5TextAttribute.TYPE;
  }

  protected getParsedValue(
    event: AttributeParseEvent,
    parseContext: Record<string, any> = {}
  ): CombinedTextExpression | null {
    const expression = super.getParsedValue(event, parseContext);
    this.validateInput(event, expression, parseContext);
    return expression;
  }

  protected validateInput(
    event: AttributeParseEvent,
    expression: CombinedTextExpression,
    parseContext: Record<string, any>
  ): void {
    event.helper.validateFormatAttribute?.({
      element: event.element,
      attribute: this.options.name,
      scope: event.scope,
      expression
    });
  }

  getEditorV5Syntax<T>(helpers: V5EditorHelpers<T>): T {
    if (!this.options.autoWatch) {
      // Ancestor tag that may contain a 'query' attribute, which determines the scope of this attribute.
      // Only used for auto-complete.
      // TODO: Replace with proper scope system at some point.
      return helpers.formatString(this.parent.getRootNode().options.name);
    }
    return helpers.formatString();
  }
  serialize(): any {
    return {
      ...super.serialize(),
      type: 'text'
    };
  }
}
