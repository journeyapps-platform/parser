import { FunctionExpression } from '@ja-platform/parser-expressions';
import { AbstractObjectTypeFactory } from '../schema/TypeFactory';
import { Type } from '@ja-platform/parser-type-system';
import { GenerateFieldEvent, Field } from './Field';

export class Param<T extends Type = Type> extends Field<T> {
  static TYPE = 'parameter';

  static isInstanceOf(obj: any): obj is Param {
    return obj instanceof Param || obj?.TYPE == Param.TYPE;
  }

  sourceTypeName?: string;
  required?: boolean;
  provideValue?: FunctionExpression;
}

export interface GenerateParamEvent<T extends Type> extends GenerateFieldEvent<T> {
  required?: boolean;
  provideValue?: FunctionExpression;
}

export class ParamFactory<T extends Type = Type> extends AbstractObjectTypeFactory<Param<T>, GenerateParamEvent<T>> {
  constructor() {
    super(Param.TYPE);
  }

  generate<T extends Type = Type>(event: GenerateParamEvent<T>): Param<T> {
    const param = new Param<T>(event.name, event.type);
    param.required = event.required;
    param.provideValue = event.provideValue;
    return param;
  }
}
