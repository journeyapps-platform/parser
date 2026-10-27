# JSON document inputs

`@ja-platform/parser-document-json` lets your parser definitions read JSON. The
same definitions can read [XML](../document-xml/README.md): change the input, and
keep the attributes, children, and validation rules.

These examples use `builder` from `@ja-platform/parser-builder` for readable
definitions. This package supplies the input adapter, `JSONNodeInput`, and also
works with definitions created directly from `@ja-platform/parser-core`.

## Attributes and content

This definition reads a numeric attribute and a text content node:

```ts
import { builder } from '@ja-platform/parser-builder';

const config = builder.node({
  name: 'config',
  fields: {
    delay: builder.number({})
  },
  nodes: {
    title: builder.contentNode()
  }
});
```

**JSON input**

```json
{ "delay": 500, "title": "App" }
```

**Resolved value**

```ts
{ delay: 500, title: 'App' }
```

JSON uses properties for both attributes and children. The definition decides
how each property is read: `delay` goes through a number attribute, while `title`
supplies a child node's content. There is no `attributes` wrapper or required
`type` property. A property cannot be declared as both an attribute and a child.

## Parsing the document

Using the `config` definition above:

```ts
import { JSONNodeInput } from '@ja-platform/parser-document-json';

const input = JSONNodeInput.parse('{"delay":500,"title":"App"}');

const parsed = config.parseTree({
  input,
  report: (diagnostic) => console.warn(diagnostic)
});
```

This produces the parsed tree. The resolved values shown below illustrate each
definition's output; see [resolving values in parser-core](../core/README.md#resolving-values)
for the value-provider setup.

JSON has no root element name. You choose the definition to parse it with, and
can optionally name the input with `JSONNodeInput.parse(text, 'config')`.

## Lists

```ts
const config = builder.node({
  name: 'config',
  fields: {},
  nodes: {
    languages: builder.array(builder.contentNode({ name: 'language' }))
  }
});
```

**JSON input** — the property matches the key, `languages`:

```json
{ "languages": ["en", "fr"] }
```

**Resolved value**

```ts
{
  languages: ['en', 'fr'];
}
```

A JSON list must be an array, even for one item: `{"languages":["en"]}`.
`{"languages":"en"}` reports an error.

## Nested objects

A child object can have attributes and children of its own:

```ts
const config = builder.node({
  name: 'config',
  fields: {},
  nodes: {
    retry: builder.node({
      name: 'retry',
      fields: { attempts: builder.number({}) },
      nodes: { message: builder.contentNode() }
    })
  }
});
```

**JSON input**

```json
{ "retry": { "attempts": 3, "message": "Try again" } }
```

**Resolved value**

```ts
{ retry: { attempts: 3, message: 'Try again' } }
```

Wrap an object node in `builder.array(...)` to read a list of objects using the
same array rules as the languages example.

## Records: names supplied by the document

Use a record when you know the shape of each value, but don't know the keys ahead
of time. Here, every size is a number:

```ts
import { numberType } from '@ja-platform/parser-type-system';

const config = builder.node({
  name: 'config',
  fields: {},
  nodes: {
    sizes: builder.record(builder.contentNode({ valueType: numberType }))
  }
});
```

**JSON input**

```json
{ "sizes": { "small": 2, "large": 4 } }
```

**Resolved value**

```ts
{ sizes: { small: 2, large: 4 } }
```

The property or element name becomes the output key. Each entry uses the same
definition and keeps its own source location. Records reject duplicate keys;
JSON records require an object. An empty record remains `{}`.

## Either: a single value or a list

```ts
const config = builder.node({
  name: 'config',
  fields: {},
  nodes: {
    voice: builder.either(builder.contentNode(), builder.array(builder.contentNode()))
  }
});
```

| JSON input                      | Resolved value                    |
| ------------------------------- | --------------------------------- |
| `{"voice":"next"}`              | `{ voice: 'next' }`               |
| `{"voice":["next","continue"]}` | `{ voice: ['next', 'continue'] }` |
| `{"voice":["next"]}`            | `{ voice: ['next'] }`             |

`.either(first, second, ...others)` accepts two or more definitions and selects
one **before parsing**. It does not catch a parse error and try another branch.
JSON arrays select repeated definitions, objects select object definitions, and
scalar content matches its declared type. No match or multiple matches produces
a diagnostic.

XML uses repetition to distinguish these two branches. It cannot distinguish
several non-repeated alternatives by native JSON types, so those choices can be
ambiguous.

## Native values and expressions

Strings follow the definition's text parsing rules. `"$:count + 1"` is an
expression only when the receiving definition supports it; the document reader
does not evaluate it.

Numbers, booleans, `null`, arrays, and objects are passed as native literal inputs.
The receiving definition still decides which values are valid. Missing properties
are different from explicit `null`:

```ts
const input = JSONNodeInput.parse('{"count":0,"empty":null}');

input.attribute('count')?.value; // 0
input.attribute('empty')?.value; // null
input.attribute('missing'); // undefined
```

## Finding errors in the source

Invalid JSON syntax throws a `SyntaxError` from `JSONNodeInput.parse()`. Comments
and trailing commas are not accepted. Definition-level errors, such as a numeric
field containing `"invalid"`, are reported through `report` during parsing.

`JSONSourceReference` retains the syntax node and its range. Offsets are UTF-16
positions with an exclusive end, so they work with `String.slice`:

```ts
const source = '{"count":"invalid"}';
const input = JSONNodeInput.parse(source);
const { start, end } = input.attribute('count')!.source.range;

source.slice(start, end); // '"invalid"'
```

Diagnostics use these references to point to the relevant value rather than just
the document root.

This package reads documents into parser inputs. It does not write JSON or replace
the schema JSON wire format provided by `@ja-platform/parser-schema-json`.
