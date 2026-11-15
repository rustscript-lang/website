<!-- docs-title: re -->

`re`

Regex builtin namespace.

**Runtime support:** native and WebAssembly.

## Import

```rss
use re;
```

## Functions

| Function | Description |
| --- | --- |
| [`match`](#match) | Returns whether a regular expression matches the input text. |
| [`find`](#find) | Returns the first substring matched by a regular expression as `Option<string>`. A missing match is `None`; an empty match stays `Some("")`. |
| [`replace`](#replace) | Replaces all regular-expression matches in a string. |
| [`split`](#split) | Splits a string on regular-expression matches. |
| [`captures`](#captures) | Returns the capture groups of the first match. Group 0 and every participating group are `Some`; an unmatched optional group is `None`, and a missing match is an empty array. |

## Function details

### `match`

```rss
fn match(pattern: string, text: string) -> bool
```

Returns whether a regular expression matches the input text.

### `find`

```rss
fn find(pattern: string, text: string) -> Option<string>
```

Returns the first substring matched by a regular expression as `Option<string>`. A missing match is `None`; an empty match stays `Some("")`.

### `replace`

```rss
fn replace(pattern: string, text: string, replacement: string) -> string
```

Replaces all regular-expression matches in a string.

### `split`

```rss
fn split(pattern: string, text: string) -> [string]
```

Splits a string on regular-expression matches.

### `captures`

```rss
fn captures(pattern: string, text: string) -> [Option<string>]
```

Returns the capture groups of the first match. Group 0 and every participating group are `Some`; an unmatched optional group is `None`, and a missing match is an empty array.
