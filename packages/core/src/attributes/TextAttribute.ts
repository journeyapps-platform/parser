import { AttributeInputLocation } from '../input/AttributeInput';
import { AttributeParseEvent } from '../AttributeParseEvent';
import { Attribute, AttributeGenerics, AttributeOptions, StringifyDirective } from './Attribute';
import type { AttributeInput } from '../input/AttributeInput';
import type { NodeInput } from '../input/NodeInput';
import type { ParsedNode } from '../parsed/ParsedNode';
import {
  FormatStringExpression,
  ConstantExpression,
  CombinedParser,
  FunctionExpressionParser,
  EvaluatedExpressionParser,
  FormatStringExpressionParser,
  EvaluatedExpression
} from '@ja-platform/parser-expressions';
import { textType } from '@ja-platform/parser-type-system';

export type CombinedTextExpression = ConstantExpression<string> | FormatStringExpression | EvaluatedExpression;

export type TextAttributeOptions<Value = string> = AttributeOptions<Value, Value> & {
  allowContentFromNode?: boolean;
};

export interface TextAttributeGenerics<Value = string> extends AttributeGenerics {
  Value: CombinedTextExpression | null;
  Options: TextAttributeOptions<Value>;
  NormalizedValue: Value;
}

export class TextAttribute<
  T extends TextAttributeGenerics<unknown> = TextAttributeGenerics,
  Options extends T['Options'] = T['Options']
> extends Attribute<T & { Options: Options }> {
  static TYPE = 'text-attribute';

  static isInstanceOf(attr: Attribute): attr is TextAttribute<TextAttributeGenerics<unknown>> {
    return attr.type === TextAttribute.TYPE;
  }

  constructor(options: Options) {
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

  protected getInput(node?: NodeInput): AttributeInput | undefined {
    const attribute = super.getInput(node);
    if (attribute || !this.options.allowContentFromNode) return attribute;
    const content = node?.content();
    if (!content) return undefined;
    return { ...content, location: AttributeInputLocation.CONTENT };
  }

  stringify(value: T['Value'], parent: ParsedNode): StringifyDirective {
    const directive = super.stringify(value, parent);
    if (!this.options.allowContentFromNode) return directive;
    return { ...directive, isAttribute: !parent.content() };
  }

  protected getParsedValue(event: AttributeParseEvent): CombinedTextExpression | null {
    let expression = super.getParsedValue(event);
    if (expression instanceof FormatStringExpression && expression.parameters.length === 0) {
      expression = new ConstantExpression({
        value: expression.render([]),
        valueType: textType,
        tokens: expression.tokens,
        start: expression.start
      });
    }
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
    if (this.options.allowContentFromNode) {
      return { ...super.serialize(), type: 'content-text' };
    }
    return {
      ...super.serialize(),
      type: 'text'
    };
  }
}
