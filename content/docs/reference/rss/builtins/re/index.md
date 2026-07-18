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
| [`find`](#find) | Returns the first substring matched by a regular expression. |
| [`replace`](#replace) | Replaces all regular-expression matches in a string. |
| [`split`](#split) | Splits a string on regular-expression matches. |
| [`captures`](#captures) | Returns the capture groups produced by the first regular-expression match. |

## Function details

### `match`

```rss
fn match(pattern: string, text: string) -> bool
```

Returns whether a regular expression matches the input text.

### `find`

```rss
fn find(pattern: string, text: string) -> string
```

```rss
null
```

Returns the first substring matched by a regular expression.

### `replace`

```rss
fn replace(pattern: string, text: string, replacement: string) -> string
```

Replaces all regular-expression matches in a string.

### `split`

```rss
fn split(pattern: string, text: string) -> array
```

Splits a string on regular-expression matches.

### `captures`

```rss
fn captures(pattern: string, text: string) -> array
```

Returns the capture groups produced by the first regular-expression match.
