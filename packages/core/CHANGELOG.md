# @journeyapps-platform/parser-v5

## 11.1.1

### Patch Changes

- 8fe18eb2: Fixed minor typo in attribute `parse()` error logging

## 11.1.0

### Minor Changes

- 056efebf: V5: Added `options` to `setupShowHideif` to allow setting the `autoWatch` field.

### Patch Changes

- 570b51d2: Bump dependency versions.
- Updated dependencies [570b51d2]
  - @journeyapps/component-parser-base@1.1.1

## 11.0.4

### Patch Changes

- d85d2bb: Add isInstanceOf method to V5IconAttribute

## 11.0.3

### Patch Changes

- b1fd763: Bumped `journey-lib` packages to latest production
- abf8fd0: Minor styling cleanup
- Updated dependencies [b1fd763]
- Updated dependencies [abf8fd0]
  - @journeyapps/component-parser-base@1.1.0

## 11.0.2

### Patch Changes

- eaca878: Fix `V5CompositionNode` - should handle one or multiple compNodes

## 11.0.1

### Patch Changes

- 204b1ed: Regression: Reverted some moved interfaces and constants used for action node attributes

## 11.0.0

### Major Changes

- c877052: Moved action node setup function to runtime components

## 10.1.1

### Patch Changes

- de420dc: Improvements to parse error reporting

## 10.1.0

### Minor Changes

- 85c1b27: feature: Improve return type of `V5BooleanAttribute.getParsedValue()` and `V5CompositionNode` parsing will add childCompositionNodes onto `_parsedCompositionNodes`.

### Patch Changes

- 0d38109: Migrated remaning unit tests to vitest, bump vitest@1.6.0 and remove karma, jasmine and webpack.
- Updated dependencies [0d38109]
  - @journeyapps/component-parser-base@1.0.2

## 10.0.0

### Major Changes

- [#403](https://github.com/journeyapps-platform/journey-js/pull/403) [`9099d8c3284889ca6d85eed285258d23b9e27656`](https://github.com/journeyapps-platform/journey-js/commit/9099d8c3284889ca6d85eed285258d23b9e27656) Thanks [@dylanvorster](https://github.com/dylanvorster)! - Feature: View Template support

### Patch Changes

- Updated dependencies [[`9099d8c3284889ca6d85eed285258d23b9e27656`](https://github.com/journeyapps-platform/journey-js/commit/9099d8c3284889ca6d85eed285258d23b9e27656)]:
  - @journeyapps/component-parser-base@1.0.1

## 9.0.0

### Major Changes

- [#401](https://github.com/journeyapps-platform/journey-js/pull/401) [`d48fe0e`](https://github.com/journeyapps-platform/journey-js/commit/d48fe0e590a8b58d6bd83d9965ef4db34b9ecc2f) Thanks [@dylanvorster](https://github.com/dylanvorster)! - Split out public and private types

### Patch Changes

- Updated dependencies [[`d48fe0e`](https://github.com/journeyapps-platform/journey-js/commit/d48fe0e590a8b58d6bd83d9965ef4db34b9ecc2f)]:
  - @journeyapps/component-parser-base@1.0.0

## 8.0.0

### Major Changes

- [#399](https://github.com/journeyapps-platform/journey-js/pull/399) [`33e7564`](https://github.com/journeyapps-platform/journey-js/commit/33e75648cf7eba01e7e70c16960cca211bb3b554) Thanks [@dylanvorster](https://github.com/dylanvorster)! - Dont rely on parser-common for component stuff + redesign the core-tree and parser-traverser system

## 7.9.0

### Minor Changes

- [#394](https://github.com/journeyapps-platform/journey-js/pull/394) [`123a06a`](https://github.com/journeyapps-platform/journey-js/commit/123a06aa65cfa25bac87a2a07e7365d921de3531) Thanks [@Manrich121](https://github.com/Manrich121)! - Updates to types and specs after bumping @journeyapps/parser-schema and @journeyapps/db

## 7.8.1

### Patch Changes

- [#390](https://github.com/journeyapps-platform/journey-js/pull/390) [`0f84e39`](https://github.com/journeyapps-platform/journey-js/commit/0f84e39cdddaec91a83595fd9ed74ee227f520b0) Thanks [@Manrich121](https://github.com/Manrich121)! - Specify key for 'font' attribute on V5Component

## 7.8.0

### Minor Changes

- [#388](https://github.com/journeyapps-platform/journey-js/pull/388) [`a121159`](https://github.com/journeyapps-platform/journey-js/commit/a1211598d4f890523ed2adf518f452b76e9560b2) Thanks [@Manrich121](https://github.com/Manrich121)! - Add 'font' attribute to V5Component node, used to override font-family

## 7.7.2

### Patch Changes

- [#383](https://github.com/journeyapps-platform/journey-js/pull/383) [`ef7ae77f`](https://github.com/journeyapps-platform/journey-js/commit/ef7ae77fad3ca3229c68beb3a6e88faec90b32eb) Thanks [@github-actions](https://github.com/apps/github-actions)! - Bump to be tagged correctly

## 7.7.1

### Patch Changes

- [#382](https://github.com/journeyapps-platform/journey-js/pull/382) [`832c1fc`](https://github.com/journeyapps-platform/journey-js/commit/832c1fc48cde7253bdaf1a9718d6e85ab02187ba) Thanks [@Manrich121](https://github.com/Manrich121)! - Patch package versions to be correctly tagged with git tag `latest`

## 7.7.0

### Minor Changes

- [#379](https://github.com/journeyapps-platform/journey-js/pull/379) [`aecd722`](https://github.com/journeyapps-platform/journey-js/commit/aecd722b4bf6b851d2dcae63957eb8ba52af1780) Thanks [@benitav](https://github.com/benitav)! - Improve attribute descriptions for OXIDE's autocomplete. V5ActionNode, V5Component show-if/hide-if/behavior/theme

## 7.6.2

### Patch Changes

- [#372](https://github.com/journeyapps-platform/journey-js/pull/372) [`c0eadb7`](https://github.com/journeyapps-platform/journey-js/commit/c0eadb7abb43f62b89b92731521f8d7f9bc209bb) Thanks [@Manrich121](https://github.com/Manrich121)! - Add changesets and move to using workspace:\*
