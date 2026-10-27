import { AttributeInputKind, NodeInputKind } from '@ja-platform/parser-core';
import type { AttributeInput, NodeInput, NodeInputSelector, NodeInputSelection } from '@ja-platform/parser-core';
import * as xml from '@journeyapps/common-xml';
import { DOMParser } from '@journeyapps/domparser';
import { XMLSourceReference } from './XMLSourceReference';

type Element = ReturnType<typeof xml.parse>['documentElement'];

/** XML extraction lives here; attribute definitions only interpret its inputs. */
export class XMLNodeInput implements NodeInput {
  readonly source: XMLSourceReference;
  readonly kind = NodeInputKind.ELEMENT;

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

  *attributeNames(): Iterable<string> {
    for (let index = 0; index < this.element.attributes.length; index++) {
      yield this.element.attributes[index].name;
    }
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

  recordEntries(): NodeInputSelection {
    return { inputs: Array.from(this.children()), present: true, source: this.source, diagnostics: [] };
  }

  selectChildren(selectors: readonly NodeInputSelector[]): NodeInputSelection {
    const names = new Set(selectors.map((selector) => selector.name));
    const inputs = Array.from(this.children()).filter((child) => names.has(child.name));
    return { inputs, present: inputs.length > 0, source: this.source, diagnostics: [] };
  }

  *children(): Iterable<XMLNodeInput> {
    for (const element of xml.children(this.element)) yield new XMLNodeInput(element, this.text);
  }
}
