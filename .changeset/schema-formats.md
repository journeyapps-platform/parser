---
'@ja-platform/parser-schema': major
'@ja-platform/parser-schema-xml': minor
'@ja-platform/parser-schema-json': minor
---

Separate the resolved schema graph from XML parsing and JSON serialization. Rename Variable to Field, remove format-specific methods from Schema, and retain XML declarations in XML-specific schema, model and field subclasses.

Replace the legacy XML schema parser with parser-core node definitions and remove the legacy parser API and diagnostic collector. Move template function signatures out of the schema package.
