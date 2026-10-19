import type { ConstantExpression, FormatStringExpression, AbstractExpression } from '@ja-platform/parser-expressions';
import type { V5Node } from '../nodes/V5Node';
import type { ParsedArrayNode } from './ParsedArrayNode';
import type { ParsedAttribute } from './ParsedAttribute';
import type { ParsedNode } from './ParsedNode';

export type ParsedChild = ParsedNode<any, any> | ParsedArrayNode<any>;

export type ParsedExpression = AbstractExpression;

export interface ParsedNodeShape {
  [key: string]: ParsedNodeShapeValue;
}

declare const ParsedAttributeNamesSymbol: unique symbol;
declare const ParsedExpressionNamesSymbol: unique symbol;
declare const ParsedImplicitExpressionNamesSymbol: unique symbol;
declare const ParsedChildNamesSymbol: unique symbol;
declare const ParsedRequiredAttributeNamesSymbol: unique symbol;
declare const ParsedConstantAttributeNamesSymbol: unique symbol;

export interface ParsedAttributeNamesMarker<Names extends string> {
  readonly [ParsedAttributeNamesSymbol]?: Names;
}

export interface ParsedExpressionNamesMarker<Names extends string> {
  readonly [ParsedExpressionNamesSymbol]?: Names;
}

/**
 * Expression names contributed by a specialized node independently of its declared fields.
 */
export interface ParsedImplicitExpressionNamesMarker<Names extends string> {
  readonly [ParsedImplicitExpressionNamesSymbol]?: Names;
}

type ParsedImplicitExpressionName<Shape> =
  Shape extends ParsedImplicitExpressionNamesMarker<infer Names> ? Names : never;

export interface ParsedChildNamesMarker<Names extends string> {
  readonly [ParsedChildNamesSymbol]?: Names;
}

export interface ParsedRequiredAttributeNamesMarker<Names extends string> {
  readonly [ParsedRequiredAttributeNamesSymbol]?: Names;
}

export interface ParsedConstantAttributeNamesMarker<Names extends string> {
  readonly [ParsedConstantAttributeNamesSymbol]?: Names;
}

export type ParsedNodeAttributeName<T> = T extends ParsedAttributeNamesMarker<infer Names> ? Names : string;
export type ParsedNodeExpressionName<T> = T extends ParsedExpressionNamesMarker<infer Names> ? Names : never;
export type ParsedNodeChildName<T> = T extends ParsedChildNamesMarker<infer Names> ? Names : never;
export type ParsedNodeRequiredAttributeName<T> =
  T extends ParsedRequiredAttributeNamesMarker<infer Names> ? Names : never;
export type ParsedNodeConstantAttributeName<T> =
  T extends ParsedConstantAttributeNamesMarker<infer Names> ? Names : never;

export type ParsedNodeShapeValue =
  ParsedExpression | ParsedNode<any, any> | ParsedArrayNode<any> | ParsedNodeShapeValue[] | null | undefined;

export type ParsedNodeDefinition<T> = V5Node<any>;
export type ParsedNodeAttributeShape<T> = T extends V5Node ? ParsedNodeShape : T;
export type ParsedNodeShapeKey<Shape> = Extract<keyof ParsedNodeAttributeShape<Shape>, string>;
export type ParsedNodeChildKey<Shape> = {
  [Key in ParsedNodeShapeKey<Shape>]: NonNullable<ParsedNodeAttributeShape<Shape>[Key]> extends ParsedChild
    ? Key
    : never;
}[ParsedNodeShapeKey<Shape>];
export type ParsedNodeKnownChildKey<Shape> =
  Shape extends ParsedChildNamesMarker<any>
    ? Extract<ParsedNodeChildName<Shape>, ParsedNodeShapeKey<Shape>>
    : ParsedNodeChildKey<Shape>;
export type ParsedNodeExpressionKey<Shape> =
  Shape extends ParsedExpressionNamesMarker<any>
    ? Extract<ParsedNodeExpressionName<Shape> | ParsedImplicitExpressionName<Shape>, ParsedNodeShapeKey<Shape>>
    : Exclude<ParsedNodeShapeKey<Shape>, ParsedNodeChildKey<Shape>>;
export type ParsedNodeUntypedExpressionKey<Shape> = string extends ParsedNodeExpressionKey<Shape> ? string : never;
export type ParsedNodeAttribute<Shape, Key extends ParsedNodeExpressionKey<Shape>> =
  Key extends ParsedNodeConstantAttributeName<Shape>
    ? ParsedAttribute<Extract<ParsedNodeAttributeShape<Shape>[Key], ConstantExpression<any> | null>>
    : ParsedAttribute<ParsedNodeAttributeShape<Shape>[Key]>;
export type ParsedNodeChild<Shape, Key extends ParsedNodeKnownChildKey<Shape>> = Extract<
  NonNullable<ParsedNodeAttributeShape<Shape>[Key]>,
  ParsedChild
>;

export type ParsedExpressionValue<Value> = Value extends null | undefined
  ? Value
  : Value extends ConstantExpression<any>
    ? ReturnType<Value['value']>
    : Value extends FormatStringExpression
      ? string
      : Value extends AbstractExpression
        ? any
        : Value extends ParsedNode<any, infer NodeValue>
          ? NodeValue
          : Value extends ParsedArrayNode<infer Child>
            ? Child extends ParsedNode<any, infer ChildValue>
              ? ChildValue[]
              : Child extends ParsedArrayNode<infer NestedChild>
                ? ParsedExpressionValue<ParsedArrayNode<NestedChild>>[]
                : ParsedNodeValue<ParsedNodeShape>[]
            : Value extends Array<infer Item>
              ? ParsedExpressionValue<Item>[]
              : Value;

export type ParsedNodeValue<Shape = ParsedNodeShape> = {
  [Key in keyof Shape]?: ParsedExpressionValue<Shape[Key]>;
};

export type ParsedNodeValueRequestKey<Shape, Value> = Extract<
  ParsedNodeExpressionKey<Shape>,
  (keyof Value & string) | ParsedImplicitExpressionName<Shape>
>;

export type ParsedNodeValueRequest<
  Shape,
  Value,
  Keys extends readonly ParsedNodeValueRequestKey<Shape, Value>[]
> = Pick<
  Value & {
    [Key in ParsedImplicitExpressionName<Shape>]?: Key extends keyof ParsedNodeAttributeShape<Shape>
      ? ParsedExpressionValue<ParsedNodeAttributeShape<Shape>[Key]>
      : never;
  },
  Keys[number]
>;
