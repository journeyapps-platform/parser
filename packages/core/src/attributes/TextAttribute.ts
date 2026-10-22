import { AttributeInputLocation } from '../input/AttributeInput';
import { AttributeParseEvent } from '../AttributeParseEvent';
import { Attribute, AttributeGenerics, AttributeOptions } from './Attribute';
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

export type TextAttributeOptions<Value = string> = AttributeOptions<Value, Value>;

export interface TextAttributeGenerics<Value = string> extends AttributeGenerics {
  Value: CombinedTextExpression | null;
  Options: TextAttributeOptions<Value>;
  NormalizedValue: Value;
}

export class TextAttribute<T extends TextAttributeGenerics<unknown> = TextAttributeGenerics> extends Attribute<T> {
  static TYPE = 'text-attribute';

  constructor(options: T['Options']) {
    super(TextAttribute.TYPE, {
      ...options,
      valueType: options.valueType ?? textType,
      syntax:
        options.syntax ??
        new CombinedParser<CombinedTextExpression>([
          new FunctionExpressionParser(),
          new EvaluatedExpressionParser(),
          new FormatStringExpressionParser()
        ]),
      configurable: options.configurable ?? true
    });
  }

  static isInstanceOf(attr: Attribute): attr is TextAttribute<TextAttributeGenerics<unknown>> {
    return attr.type === TextAttribute.TYPE;
  }

  protected getParsedValue(event: AttributeParseEvent): CombinedTextExpression | null {
    const expression = super.getParsedValue(event);
    this.validateInput(event, expression);
    return expression;
  }

  protected validateInput(event: AttributeParseEvent, expression: CombinedTextExpression): void {
    event.context?.validateExpression?.({
      attribute: this,
      expression,
      source: event.input.source,
      location: event.input.location ?? AttributeInputLocation.ATTRIBUTE
    });
  }

  serialize(): any {
    return {
      ...super.serialize(),
      type: 'text'
    };
  }
}
