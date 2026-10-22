import { AttributeInputKind } from '@ja-platform/parser-core';
import type { AttributeInput, NodeInput } from '@ja-platform/parser-core';
import * as xml from '@journeyapps/common-xml';
import { DOMParser } from '@journeyapps/domparser';
import { XMLSourceReference } from './XMLSourceReference';

type Element = ReturnType<typeof xml.parse>['documentElement'];

/** XML extraction lives here; attribute definitions only interpret its inputs. */
export class XMLNodeInput implements NodeInput {
  readonly source: XMLSourceReference;

  constructor(
    private readonly element: Element,
    private readonly text: string
  ) {
    this.source = new XMLSourceReference(element, text);
  }

  static parse(text: string): XMLNodeInput {
    return new XMLNodeInput(new DOMParser().parseFromString(text, 'text/xml').documentElement, text);
  }

  get name(): string {
    return this.element.tagName;
  }

  attribute(name: string): AttributeInput | undefined {
    const value = xml.getAttribute(this.element, name);
    if (value == null) return undefined;
    return {
      kind: AttributeInputKind.TEXT,
      value,
      source: new XMLSourceReference(xml.attributeNode(this.element, name) ?? this.element, this.text)
    };
  }

  content(): AttributeInput | undefined {
    const value = this.element.textContent;
    if (value == null) return undefined;
    return { kind: AttributeInputKind.TEXT, value, source: this.source };
  }

  *children(): Iterable<XMLNodeInput> {
    for (const element of xml.children(this.element)) yield new XMLNodeInput(element, this.text);
  }
}
