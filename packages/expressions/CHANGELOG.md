# @journeyapps/evaluator

## 7.1.0

### Minor Changes

- 45344a4: Consolidate the type system, expressions, parser definitions and schema into the parser repository. Rename the former types, evaluator and parser-v5 packages. Expose Day and date utilities from parser-schema and keep schema error collection internal.

### Patch Changes

- Updated dependencies [45344a4]
  - @ja-platform/parser-type-system@0.2.0

## 7.0.5

### Patch Changes

- d2e1526: Refactor `Batch`, `DatabaseObject` and `VariableFormatStringScope` to use `async` and return early.

## 7.0.4

### Patch Changes

- 9abb3f9: Improve parsing of await- and member expressions

## 7.0.3

### Patch Changes

- a68b965: fix: Parsing AwaitExpression into FunctionTokenExpression and improve error handling in TokenExpressionParser when using Babel parser.

## 7.0.2

### Patch Changes

- 16bb578: Fix: Add support for parsing `TemplateLiternal` expressions

## 7.0.1

### Patch Changes

- 30aa390: Improve `ShorthandTokenExpression` to also parse properties, i.e. object.property1, object['property2']. Added `isComputed` to `TokenExpression` options

## 7.0.0

### Major Changes

- 2260401: Feature: Improve TokenExpression parsing using `@babel/parser` to parse source code into an AST and for each Expression use a registered `ExpressionNodeParser` to output one or more `TokenExpression`s.

### Patch Changes

- fe96da7: Repo upgrade - bump node version, migrate unit test to `vitest` and improve consistancy with `tsconfig`
- Updated dependencies [fe96da7]
  - @journeyapps/core-xml@5.0.4

## 6.2.4

### Patch Changes

- cc89366: Version bump hotfix
- Updated dependencies [cc89366]
  - @journeyapps/core-xml@5.0.3

## 6.2.3

### Patch Changes

- a4db92f: Improve schema definitions for view params and variables
- Updated dependencies [a4db92f]
  - @journeyapps/core-xml@5.0.2
