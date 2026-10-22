import { AttributeInputLocation } from '../input/AttributeInput';
import type { NodeInput } from '../input/NodeInput';
import type { AttributeInput } from '../input/AttributeInput';
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
import { ParseEvent } from '../ParseEvent';
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
  protected getInput(node?: NodeInput): AttributeInput | undefined {
    const content = node?.content();
    if (!content) return undefined;
    return { ...content, location: AttributeInputLocation.CONTENT };
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
      ...options
    });
  }

  protected parseAttributes({
    parsed,
    event
  }: {
    parsed: ParsedContentNode<Expression, Value>;
    event: ParseEvent;
  }): void {
    super.parseAttributes({ parsed, event });
    const expression = parsed.attribute('content').expression();
    if (expression instanceof FormatStringExpression || expression instanceof EvaluatedExpression) {
      event.validateExpression?.({
        attribute: parsed.attribute('content').definition,
        expression,
        source: parsed.attribute('content').input?.source,
        location: AttributeInputLocation.CONTENT
      });
    }
    parsed.setContent(expression);
  }
}
