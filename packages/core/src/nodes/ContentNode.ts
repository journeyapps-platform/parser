import {
  ConstantExpression,
  ConstantExpressionParser,
  ExpressionParser,
  AbstractExpression,
  FormatStringExpression,
  EvaluatedExpression
} from '@ja-platform/parser-expressions';
import { Type } from '@ja-platform/parser-type-system';
import { Attribute } from '../attributes/Attribute';
import { AttributeParseInput } from '../AttributeParseEvent';
import { XMLParseEvent } from '../XMLParseEvent';
import { ParsedNode } from '../parsed/ParsedNode';
import { ParsedContentNode, ParsedContentNodeShape } from '../parsed/ParsedContentNode';
import { ParseTreeOptions } from './Node';
import { Node, NodeGenerics, NodeOptions } from './Node';

export type NodeDefaultOptions<Value> =
  { isMultiple?: false; defaultValue?: Value } | { isMultiple: true; defaultValue?: Value[] };

export type ContentNodeOptions<Value, Expression extends AbstractExpression = ConstantExpression<Value>> = Omit<
  NodeOptions,
  'isMultiple' | 'defaultValue'
> &
  NodeDefaultOptions<Value> & {
    valueType: Type<Value>;
    syntax?: ExpressionParser<Expression>;
  };

interface ContentNodeGenerics<Value, Expression extends AbstractExpression> extends NodeGenerics<
  ParsedContentNodeShape<Expression>,
  ParsedContentNode<Expression, Value>,
  Value | undefined
> {
  Options: ContentNodeOptions<Value, Expression>;
}

/**
 * Adapt element content to the shared value-provider pipeline.
 */
export class ContentValueAttribute extends Attribute {
  protected getInput(event: XMLParseEvent<ParsedNode>): AttributeParseInput {
    return { value: event.element?.textContent ?? null, source: event.element };
  }

  stringify(value: AbstractExpression) {
    return { isAttribute: false, value: value?.raw() ?? null };
  }
}

/**
 * Parse element content using its declared value type and optional expression syntax.
 */
export class ContentNode<Value, Expression extends AbstractExpression = ConstantExpression<Value>> extends Node<
  ContentNodeGenerics<Value, Expression>
> {
  constructor(options: ContentNodeOptions<Value, Expression>) {
    super(options);
    this.addAttribute(
      new ContentValueAttribute('content-value', {
        name: 'content',
        key: 'content',
        valueType: options.valueType,
        defaultValue: options.isMultiple ? undefined : options.defaultValue,
        syntax: options.syntax ?? new ConstantExpressionParser(options.valueType)
      })
    );
  }

  protected createParsedNode(options: ParseTreeOptions): ParsedContentNode<Expression, Value> {
    return new ParsedContentNode({
      definition: this,
      event: options.event,
      key: options.key,
      valueProviders: options.valueProviders
    });
  }

  protected parseAttributes({
    parsed,
    event
  }: {
    parsed: ParsedContentNode<Expression, Value>;
    event: XMLParseEvent<ParsedNode>;
  }): void {
    super.parseAttributes({ parsed, event });
    const expression = parsed.attribute('content').expression();
    if (expression instanceof FormatStringExpression || expression instanceof EvaluatedExpression) {
      event.helper.validateFormatContent?.({ element: event.element, scope: event.scope, expression });
    }
    parsed.setContent(expression);
  }
}
