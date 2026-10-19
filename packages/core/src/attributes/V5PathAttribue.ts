import type { EvaluatedExpression, ConstantExpression } from '@ja-platform/parser-expressions';
import { V5Attribute, V5AttributeOptions, V5AttributeGenerics } from './V5Attribute';

export type CombinedPathExpression = EvaluatedExpression | ConstantExpression;

export interface V5PathAttributeGenerics extends V5AttributeGenerics {
  Value: CombinedPathExpression | null;
}

export class V5PathAttribute extends V5Attribute<V5PathAttributeGenerics> {
  static TYPE = 'path-attribute';

  constructor(options: Omit<V5AttributeOptions, 'configurable'>) {
    super(V5PathAttribute.TYPE, options);
  }
  serialize(): any {
    return {
      ...super.serialize(),
      type: 'path'
    };
  }
}
