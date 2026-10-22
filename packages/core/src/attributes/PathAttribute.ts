import type { EvaluatedExpression, ConstantExpression } from '@ja-platform/parser-expressions';
import { Attribute, AttributeOptions, AttributeGenerics } from './Attribute';

export type CombinedPathExpression = EvaluatedExpression | ConstantExpression;

export interface PathAttributeGenerics extends AttributeGenerics {
  Value: CombinedPathExpression | null;
}

export class PathAttribute extends Attribute<PathAttributeGenerics> {
  static TYPE = 'path-attribute';

  constructor(options: Omit<AttributeOptions, 'configurable'>) {
    super(PathAttribute.TYPE, options);
  }
  serialize(): any {
    return {
      ...super.serialize(),
      type: 'path'
    };
  }
}
