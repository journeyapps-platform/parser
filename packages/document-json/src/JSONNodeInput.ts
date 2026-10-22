import { AttributeInputKind } from '@ja-platform/parser-core';
import type { AttributeInput, NodeInput } from '@ja-platform/parser-core';
import { findNodeAtLocation, getNodeValue, Node, ParseError, parseTree, printParseErrorCode } from 'jsonc-parser';
import { JSONSourceReference } from './JSONSourceReference';

/** Default document shape: { type, attributes?, content?, children? }. */
export class JSONNodeInput implements NodeInput {
  readonly source: JSONSourceReference;

  constructor(private readonly node: Node) {
    this.source = new JSONSourceReference(node);
  }

  get name(): string {
    const type = findNodeAtLocation(this.node, ['type']);
    if (type?.type !== 'string') return '';
    return type.value;
  }

  static parse(text: string): JSONNodeInput {
    const errors: ParseError[] = [];
    const node = parseTree(text, errors, { disallowComments: true, allowTrailingComma: false });
    if (errors.length) {
      const error = errors[0];
      throw new SyntaxError(`${printParseErrorCode(error.error)} at offset ${error.offset}`);
    }
    if (!node) throw new SyntaxError('Expected a JSON document node');
    return new JSONNodeInput(node);
  }

  attribute(name: string): AttributeInput | undefined {
    return this.input(findNodeAtLocation(this.node, ['attributes', name]));
  }

  content(): AttributeInput | undefined {
    return this.input(findNodeAtLocation(this.node, ['content']));
  }

  *children(): Iterable<JSONNodeInput> {
    const children = findNodeAtLocation(this.node, ['children']);
    for (const child of children?.children ?? []) yield new JSONNodeInput(child);
  }

  private input(node?: Node): AttributeInput | undefined {
    if (!node) return undefined;
    const source = new JSONSourceReference(node);
    if (node.type === 'string') return { kind: AttributeInputKind.TEXT, value: node.value, source };
    return { kind: AttributeInputKind.LITERAL, value: getNodeValue(node), source };
  }
}
