# XML document inputs

`@ja-platform/parser-document-xml` lets your parser definitions read XML. The
same definitions can read [JSON](../document-json/README.md): change the input, and
keep the attributes, children, and validation rules.

These examples use `builder` from `@ja-platform/parser-builder` for readable
definitions. This package supplies the input adapter, `XMLNodeInput`, and also
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

**XML input**

```xml
<config delay="500">
  <title>App</title>
</config>
```

**Resolved value**

```ts
{ delay: 500, title: 'App' }
```

XML keeps attributes and child elements separate. Here, `delay="500"` supplies
the number attribute, while the text inside `<title>` supplies the content node.
The definition converts the attribute text to a number. JSON represents both
as properties; the same definition decides how to read each one.

## Parsing the document

Using the `config` definition above:

```ts
import { XMLNodeInput } from '@ja-platform/parser-document-xml';

const input = XMLNodeInput.parse('<config delay="500"><title>App</title></config>');

const parsed = config.parseTree({
  input,
  report: (diagnostic) => console.warn(diagnostic)
});
```

This produces the parsed tree. The resolved values shown below illustrate each
definition's output; see [resolving values in parser-core](../core/README.md#resolving-values)
for the value-provider setup.

The XML input gets its name from the root element: `input.name` is `'config'`.
Attributes and child elements retain their source locations as the definition
reads them.

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

**XML input** — elements match the name, `language`:

```xml
<config>
  <language>en</language>
  <language>fr</language>
</config>
```

**Resolved value**

```ts
{
  languages: ['en', 'fr'];
}
```

A repeated definition returns an array even when there is only one element:
`<config><language>en</language></config>` resolves to
`{ languages: ['en'] }`. No extra `<languages>` wrapper is needed.

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

**XML input**

```xml
<config>
  <retry attempts="3">
    <message>Try again</message>
  </retry>
</config>
```

**Resolved value**

```ts
{ retry: { attempts: 3, message: 'Try again' } }
```

Wrap an object node in `builder.array(...)` to read a list of objects using the
same repeated-element rules as the languages example.

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

**XML input**

```xml
<config>
  <sizes>
    <small>2</small>
    <large>4</large>
  </sizes>
</config>
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

| XML input                                                     | Resolved value                    |
| ------------------------------------------------------------- | --------------------------------- |
| `<config><voice>next</voice></config>`                        | `{ voice: 'next' }`               |
| `<config><voice>next</voice><voice>continue</voice></config>` | `{ voice: ['next', 'continue'] }` |

`.either(first, second, ...others)` accepts two or more definitions and selects
one **before parsing**. It does not catch a parse error and try another branch.
JSON arrays select repeated definitions, objects select object definitions, and
scalar content matches its declared type. No match or multiple matches produces
a diagnostic.

XML uses repetition to distinguish these two branches. It cannot distinguish
several non-repeated alternatives by native JSON types, so those choices can be
ambiguous.

## Text values and expressions

XML supplies text for attributes and content. The receiving definition decides
whether that text is a number, a boolean, literal text, or an expression.
For example, `delay="500"` becomes a number because the definition uses
`builder.number({})`.

`"$:count + 1"` is an expression only when the receiving definition supports it;
the document reader does not evaluate it.

An absent attribute is different from an empty one. XML has no native `null`
value: the text `"null"` is still text when it reaches the definition.

```ts
const input = XMLNodeInput.parse('<config count="0" empty="" />');

input.attribute('count')?.value; // '0'
input.attribute('empty')?.value; // ''
input.attribute('missing'); // undefined
```

For direct input access, `input.attribute(name)` reads an attribute,
`input.content()` reads the element's text content, and `input.children()`
iterates its child elements. Definitions use these inputs to parse the tree.

## Finding errors in the source

Definition-level errors, such as a numeric field containing `"invalid"`, are
reported through `report` during parsing. Their source references identify the
relevant attribute or element.

`XMLSourceReference` retains the original positional XML object and exposes its
range as UTF-16 offsets with an exclusive end. You can use the range to select
the corresponding source text:

```ts
const source = '<config count="invalid" />';
const input = XMLNodeInput.parse(source);
const { start, end } = input.attribute('count')!.source.range;

const highlightedSource = source.slice(start, end);
```

The XML adapter keeps the source text needed to calculate these offsets.
XML serializers can recover the original XML object through
`XMLSourceReference.element`; parser core does not need to depend on XML types.

This package supplies document inputs. Schema-specific XML loading belongs to
`@ja-platform/parser-schema-xml`.
