# XML document inputs

`XMLNodeInput.parse(text)` exposes attribute, content, and child inputs. Pass an
input to `attribute.parseInput(node.attribute(name), context)`. For content-backed
attributes, the caller selects `node.attribute(name) ?? node.content()`.

Source references retain the XML positional object and expose its diagnostic
range as UTF-16 offsets (exclusive end). The input document owns the source text.

Pass the input to a definition using a format-independent parse event:

```ts
definition.parseTree({
  input: XMLNodeInput.parse(sourceText),
  report: (diagnostic) => diagnostics.push(diagnostic)
});
```

Nodes traverse the input's children and pass the same event to attributes as
their context. Parsed nodes and attributes retain their input; diagnostics carry
source references. XML serializers can recover original XML objects from
`XMLSourceReference` without introducing XML dependencies into parser core.
