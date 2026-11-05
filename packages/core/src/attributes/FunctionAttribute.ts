import { FunctionExpression, FunctionExpressionParser } from '@ja-platform/parser-expressions';
import { Attribute, AttributeGenerics } from './Attribute';

export interface FunctionAttributeGenerics extends AttributeGenerics {
  Value: FunctionExpression | null;
}

export class FunctionAttribute extends Attribute<FunctionAttributeGenerics> {
  static TYPE = 'on-function-attribute';

  constructor(options: Omit<AttributeGenerics['Options'], 'configurable'>) {
    super(FunctionAttribute.TYPE, {
      autoWatch: false,
      ...options,
      syntax: options.syntax ?? new FunctionExpressionParser()
    });
  }
}
