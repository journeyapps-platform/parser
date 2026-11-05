import { ConstantExpression } from '@ja-platform/parser-expressions';
import { ParsedAttribute } from '../parsed/ParsedAttribute';
import { AbstractValueProvider } from './AbstractValueProvider';
import { ParsedProviderValue } from './ParsedProviderValue';

/**
 * Resolve literal expressions synchronously without an evaluation scope.
 */
export class ConstantExpressionValueProvider extends AbstractValueProvider {
  protected createProviderValue<T>(attribute: ParsedAttribute): ParsedProviderValue<T> {
    const expression = attribute.expression();
    const active = expression instanceof ConstantExpression;
    return new ParsedProviderValue<T>({
      value: active ? (expression.value() as T) : undefined,
      active,
      provider: this
    });
  }
}
