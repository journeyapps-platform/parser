# JSON document inputs

`JSONNodeInput.parse(text)` reads strict JSON using the initial representation
`{ type, attributes?, content?, children? }`. Strings use attribute expression
syntax; other JSON values are native literals. Missing attributes return
`undefined`, distinct from explicit `null`. Definitions decide whether native
literal values are supported.

Pass an input to `attribute.parseInput(node.attribute(name), context)`. Source
references retain the JSON syntax node and UTF-16 offsets (exclusive end).

This package currently supplies inputs, not a complete definition-driven tree
parser or document writer. It does not replace the schema JSON wire format.
