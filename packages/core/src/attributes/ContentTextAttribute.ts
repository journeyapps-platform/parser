import { AttributeParseEvent, AttributeParseInput } from '../AttributeParseEvent';
import { CombinedTextExpression, TextAttribute, TextAttributeGenerics, TextAttributeOptions } from './TextAttribute';
import { StringifyDirective } from './Attribute';
import { ParsedNode } from '../parsed/ParsedNode';
import { XMLParseEvent } from '../XMLParseEvent';
import { getAttribute } from '@journeyapps/common-xml';

export interface ContentTextAttributeOptions extends Omit<TextAttributeOptions, 'configurable'> {}

export class ContentTextAttribute extends TextAttribute<
  TextAttributeGenerics & {
    Options: ContentTextAttributeOptions;
  }
> {
  static TYPE = 'content-text-attribute';

  constructor(options: ContentTextAttributeOptions) {
    super(options);
    this.type = ContentTextAttribute.TYPE;
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

  stringify(value: TextAttributeGenerics['Value'], parent: ParsedNode): StringifyDirective {
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
