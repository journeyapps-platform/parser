import { AttributeInputKind, NodeInputKind } from '@ja-platform/parser-core';
import type { AttributeInput, NodeInput, NodeInputSelector, NodeInputSelection } from '@ja-platform/parser-core';
import { findNodeAtLocation, getNodeValue, Node, ParseError, parseTree, printParseErrorCode } from 'jsonc-parser';
import { JSONSourceReference } from './JSONSourceReference';

/** Object properties supply attributes or child nodes; scalar nodes supply content. */
export class JSONNodeInput implements NodeInput {
  readonly source: JSONSourceReference;

  get kind(): NodeInputKind {
    return this.node.type as NodeInputKind;
  }

  constructor(
    private readonly node: Node,
    readonly name: string = ''
  ) {
    this.source = new JSONSourceReference(node);
  }

  static parse(text: string, name = ''): JSONNodeInput {
    const errors: ParseError[] = [];
    const node = parseTree(text, errors, { disallowComments: true, allowTrailingComma: false });
    if (errors.length) {
      const error = errors[0];
      throw new SyntaxError(`${printParseErrorCode(error.error)} at offset ${error.offset}`);
    }
    if (!node) throw new SyntaxError('Expected a JSON document node');
    return new JSONNodeInput(node, name);
  }

  attribute(name: string): AttributeInput | undefined {
    return this.input(findNodeAtLocation(this.node, [name]));
  }

  content(): AttributeInput | undefined {
    return this.input(this.node);
  }

  *children(): Iterable<JSONNodeInput> {
    if (this.node.type === 'object') {
      for (const property of this.node.children ?? []) {
        const [key, value] = property.children;
        yield new JSONNodeInput(value, key.value);
      }
      return;
    }
    if (this.node.type === 'array') {
      for (const item of this.node.children ?? []) yield new JSONNodeInput(item, this.name);
    }
  }

  recordEntries(): NodeInputSelection {
    if (this.node.type !== 'object') {
      return {
        inputs: [],
        present: true,
        source: this.source,
        diagnostics: [{ source: this.source, message: 'Expected an object for record entries' }]
      };
    }
    return { inputs: Array.from(this.children()), present: true, source: this.source, diagnostics: [] };
  }

  selectChildren(selectors: readonly NodeInputSelector[], attributeNames: readonly string[] = []): NodeInputSelection {
    const result: NodeInputSelection = { inputs: [], present: false, diagnostics: [] };
    const select = (node: Node, selector: NodeInputSelector) => {
      const source = new JSONSourceReference(node);
      result.present = true;
      result.source = source;
      if (attributeNames.includes(selector.key)) {
        result.diagnostics.push({
          source,
          message: `Property '${selector.key}' is defined as both an attribute and a child`
        });
        return;
      }
      if (selector.isMultiple) {
        if (node.type !== 'array') {
          result.diagnostics.push({ source, message: `Expected an array for '${selector.key}'` });
          return;
        }
        for (const item of node.children ?? []) result.inputs.push(new JSONNodeInput(item, selector.name));
        return;
      }
      result.inputs.push(new JSONNodeInput(node, selector.name));
    };

    if (this.node.type === 'array') {
      for (const selector of selectors) select(this.node, selector);
      return result;
    }
    if (this.node.type !== 'object') return result;
    for (const property of this.node.children ?? []) {
      const [key, value] = property.children;
      const matches = selectors.filter((selector) => selector.key === key.value);
      if (matches.length > 1) {
        result.diagnostics.push({
          source: new JSONSourceReference(value),
          message: `Property '${key.value}' matches multiple child definitions`
        });
        continue;
      }
      if (matches.length === 1) select(value, matches[0]);
    }
    return result;
  }

  private input(node?: Node): AttributeInput | undefined {
    if (!node) return undefined;
    const source = new JSONSourceReference(node);
    if (node.type === 'string') return { kind: AttributeInputKind.TEXT, value: node.value, source };
    return { kind: AttributeInputKind.LITERAL, value: getNodeValue(node), source };
  }
}
