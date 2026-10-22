---
'@ja-platform/parser-core': major
'@ja-platform/parser-document-json': minor
'@ja-platform/parser-document-xml': minor
'@ja-platform/parser-expressions': minor
'@ja-platform/parser-schema': major
'@ja-platform/parser-schema-json': minor
'@ja-platform/parser-schema-xml': major
'@ja-platform/parser-type-system': major
---

Consolidate the type system, expressions, parser definitions and schema into the parser repository. Rename the former types, evaluator and parser-v5 packages.

- Replace V5-prefixed parser classes and supporting types with unversioned names, including Node, Attribute, TextAttribute, AbstractEntity, CommonEntity and NodeTemplate. Rename the schema XML grammar root to SchemaNode and match schema primitive filenames to their Type class names.
- Remove component sizes, color/size default selectors, theme/layout categories and editor helpers from parser-core. Defaults remain literal values; engine-specific default selection and editor controls belong outside core.
- Keep index.ts only at each package's source root, import internal modules directly, move the primitive type registry into PrimitiveTypes.ts and replace ParsedNodeDefinition with Node<any>.
- Introduce XML and JSON document adapters, NodeInput and extensible source references. Replace XMLParseEvent with ParseEvent, remove XML runtime dependencies from core and use input adapters for node traversal and attribute parsing. Attributes receive the same parsing context, including the parsed parent.
- Flatten node parsing options and remove valueProviders from parsing and parsed-node construction. Configure providers afterward with setValueProviders. Optional input creates declared attributes without authored expressions or source references.
- Retain input on parsed nodes and attributes instead of sourceElement. Use source references for diagnostics. Schema errors use ParsedDiagnostic, preserving parsed diagnostics unchanged and normalizing XML syntax errors to character offsets on entry.
- Separate the resolved schema graph from XML parsing and JSON serialization. Rename Variable to Field, remove format-specific Schema methods and retain XML declarations in XML-specific schema, model and field subclasses. Replace the legacy XML parser and diagnostic collector with parser-core definitions while preserving typed choice keys and XML serialization.
- Move QueryType from parser-type-system to parser-schema without changing its behavior. Expose Day and date utilities from parser-schema, keep schema error collection internal and move template function signatures out of the schema package.
- Add EnumToken for fixed grammar symbols such as operators and brackets.
