# Parser core

`@ja-platform/parser-core` defines nodes, attributes, parsed trees, and value
providers. Document adapters supply the input, so a definition can read JSON or
XML without depending on either format.

For examples of definitions and the documents they read, see
[JSON document inputs](../document-json/README.md) and
[XML document inputs](../document-xml/README.md).

## Resolving values

Parsing creates a tree of parsed nodes and expressions. Value providers tell that
tree how to resolve values. For a document containing constants and defaults:

```ts
import {
  Node,
  NumberAttribute,
  ConstantExpressionValueProvider,
  ParserDefaultValueProvider
} from '@ja-platform/parser-core';
import { JSONNodeInput } from '@ja-platform/parser-document-json';

const config = new Node({ name: 'config' });
config.addAttribute(new NumberAttribute({ name: 'delay', defaultValue: 500 }));

const parsed = config.parseTree({
  input: JSONNodeInput.parse('{"delay":250}'),
  report: (diagnostic) => console.warn(diagnostic)
});

const providers = [new ParserDefaultValueProvider(), new ConstantExpressionValueProvider()];
parsed.setValueProviders(providers);

const values = parsed.valueTree();
console.log(values.current); // { delay: 250 }

// Release the value subscription and the providers when finished.
values.dispose();
providers.forEach((provider) => provider.dispose());
```

The constant provider supplies the explicit `250`. With `{}` as the input, the
default provider supplies `500`. The same provider setup works for a tree parsed
from XML; it operates on the parsed expressions, not the source format.

For dynamic expressions, the host supplies providers that resolve references or
evaluate code. Keep that setup separate from document parsing so the same
definitions and inputs can be used in different hosts.
