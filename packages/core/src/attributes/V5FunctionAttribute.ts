import { FunctionExpression, FunctionExpressionParser } from '@ja-platform/parser-expressions';
import { V5Attribute, V5AttributeGenerics } from './V5Attribute';

export interface V5FunctionAttributeGenerics extends V5AttributeGenerics {
  Value: FunctionExpression | null;
}

export class V5FunctionAttribute extends V5Attribute<V5FunctionAttributeGenerics> {
  static TYPE = 'on-function-attribute';

  constructor(options: Omit<V5AttributeGenerics['Options'], 'configurable'>) {
    super(V5FunctionAttribute.TYPE, {
      autoWatch: false,
      ...options,
      syntax: options.syntax ?? new FunctionExpressionParser()
    });
  }
}
