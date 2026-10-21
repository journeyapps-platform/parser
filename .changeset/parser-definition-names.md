---
'@ja-platform/parser-core': major
'@ja-platform/parser-schema': major
'@ja-platform/parser-schema-xml': major
---

Replace V5-prefixed parser classes with unversioned names, including Node, Attribute, TextAttribute, AbstractEntity, and CommonEntity. Rename their supporting types and modules, V5Template to NodeTemplate, and the schema XML grammar root to SchemaNode. Match schema primitive filenames to their Type class names.

Remove component sizes, color/size default selectors, theme/layout categories, and editor helpers from parser-core. Attribute defaults are literal values and are no longer expanded into size variants. Consumers must provide engine-specific default selection and editor controls outside parser-core.

Keep index.ts only at each package's source root, import internal modules directly, and move the primitive type registry into PrimitiveTypes.ts. Replace the redundant ParsedNodeDefinition alias with Node<any>.
