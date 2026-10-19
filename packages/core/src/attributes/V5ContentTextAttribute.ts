import { AttributeParseEvent, AttributeParseInput } from '../AttributeParseEvent';
import {
  CombinedTextExpression,
  V5TextAttribute,
  V5TextAttributeGenerics,
  V5TextAttributeOptions
} from './V5TextAttribute';
import { StringifyDirective } from './V5Attribute';
import { ParsedNode } from '../parsed';
import { XMLParseEvent } from '../XMLParseEvent';
import { getAttribute } from '@journeyapps/common-xml';

export interface V5ContextTextAttributeOptions extends Omit<V5TextAttributeOptions, 'configurable'> {}

export class V5ContentTextAttribute extends V5TextAttribute<
  V5TextAttributeGenerics & {
    Options: V5ContextTextAttributeOptions;
  }
> {
  static TYPE = 'content-text-attribute';

  constructor(options: V5ContextTextAttributeOptions) {
    super(options);
    this.type = V5ContentTextAttribute.TYPE;
  }

  protected getInput(event: XMLParseEvent<ParsedNode>): AttributeParseInput {
    const input = super.getInput(event);
    if (input.value != null) {
      return input;
    }
    return { value: event.element?.textContent ?? null, source: event.element };
  }

  protected getParsedValue(
    event: AttributeParseEvent,
    parseContext: Record<string, any> = {}
  ): CombinedTextExpression | null {
    const expression = super.getParsedValue(event, parseContext);
    if (getAttribute(event.element, this.options.name) == null) {
      parseContext['_content'] = expression;
    }
    return expression;
  }

  protected validateInput(
    event: AttributeParseEvent,
    expression: CombinedTextExpression,
    parseContext: Record<string, any>
  ): void {
    if (getAttribute(event.element, this.options.name) != null) {
      super.validateInput(event, expression, parseContext);
      return;
    }
    event.helper.validateFormatContent?.({ element: event.element, scope: event.scope, expression });
  }

  stringify(value: V5TextAttributeGenerics['Value'], parent: ParsedNode): StringifyDirective {
    return {
      ...super.stringify(value, parent),
      isAttribute: !parent.content()
    };
  }

  serialize(): any {
    return {
      ...super.serialize(),
      type: 'content-text'
    };
  }
}
