import { AttributeInputLocation } from '../input/AttributeInput';
import type { NodeInput } from '../input/NodeInput';
import type { AttributeInput } from '../input/AttributeInput';
import { TextAttribute, TextAttributeGenerics, TextAttributeOptions } from './TextAttribute';
import { StringifyDirective } from './Attribute';
import { ParsedNode } from '../parsed/ParsedNode';

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

  protected getInput(node?: NodeInput): AttributeInput | undefined {
    const attribute = node?.attribute(this.name);
    if (attribute) return attribute;
    const content = node?.content();
    if (!content) return undefined;
    return { ...content, location: AttributeInputLocation.CONTENT };
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
