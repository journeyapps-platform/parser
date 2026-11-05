import { ParsedNode } from '../parsed/ParsedNode';
import { ParsedRecordNode } from '../parsed/ParsedRecordNode';
import { Node, type NodeGenerics, type NodeOptions, type ParseTreeOptions } from './Node';

type RecordShape<Entry extends Node<any>> = Record<string, ReturnType<Entry['parseTree']>>;

/** Parse named entries using one shared definition, retaining each entry's source. */
export class RecordNode<Entry extends Node<any>, Value = Entry extends Node<infer G> ? G['Value'] : never> extends Node<
  NodeGenerics<RecordShape<Entry>, ParsedRecordNode<ReturnType<Entry['parseTree']>, Value>, Record<string, Value>>
> {
  constructor(options: NodeOptions & { entry: Entry }) {
    super(options);
    this.addNode(options.entry);
  }

  protected createParsedNode(options: ParseTreeOptions): ParsedRecordNode<ReturnType<Entry['parseTree']>, Value> {
    return new ParsedRecordNode({ definition: this, ...options });
  }

  protected parseChildren({
    parsed,
    options
  }: {
    parsed: ParsedNode<RecordShape<Entry>, Record<string, Value>>;
    options: ParseTreeOptions;
  }): void {
    this.fireListeners((listener) => listener.preChildrenParse?.({ ...options, parsedNode: parsed }));
    const selection = options.input?.recordEntries();
    if (!selection) return;
    selection.diagnostics.forEach((diagnostic) => parsed.pushError(diagnostic));
    const keys = new Set<string>();
    for (const input of selection.inputs) {
      if (keys.has(input.name)) {
        parsed.pushError({ source: input.source, message: `Duplicate record key '${input.name}'` });
        continue;
      }
      keys.add(input.name);
      const child = this.nodes[0].parseInput({ parent: parsed, options, input, key: input.name });
      if (child) parsed.setChild(input.name, child);
    }
  }
}
