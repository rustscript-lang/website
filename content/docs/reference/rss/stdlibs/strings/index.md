<!-- docs-title: strings -->

`stdlib::rss::strings`

String comparison, searching, splitting, trimming, and replacement helpers.

## Import

```rss
use stdlib::rss::strings;
```

## Functions

| Function | Description |
| --- | --- |
| [`equals`](#equals) | Returns whether two strings are equal. |
| [`is_empty`](#is-empty) | Returns whether a string is empty. |
| [`non_empty`](#non-empty) | Returns whether a string is not empty. |
| [`contains`](#contains) | Returns whether a string contains a substring. |
| [`split`](#split) | Splits a string on a separator. |
| [`trim`](#trim) | Trims leading and trailing ASCII whitespace from a string. |
| [`replace`](#replace) | Replaces all matching substrings in a string. |

## Function details

### `equals`

```rss
pub fn equals(lhs: string, rhs: string) -> bool
```

Returns whether two strings are equal.

### `is_empty`

```rss
pub fn is_empty(value: string) -> bool
```

Returns whether a string is empty.

### `non_empty`

```rss
pub fn non_empty(value: string) -> bool
```

Returns whether a string is not empty.

### `contains`

```rss
pub fn contains(haystack: string, needle: string) -> bool
```

Returns whether a string contains a substring.

### `split`

```rss
pub fn split(value: string, separator: string) -> [string]
```

Splits a string on a separator.

### `trim`

```rss
pub fn trim(value: string) -> string
```

Trims leading and trailing ASCII whitespace from a string.

### `replace`

```rss
pub fn replace(value: string, needle: string, replacement: string) -> string
```

Replaces all matching substrings in a string.
