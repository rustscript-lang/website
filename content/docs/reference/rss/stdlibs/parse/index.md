<!-- docs-title: parse -->

`stdlib::rss::parse`

Validated integer and boolean parsing helpers.

## Import

```rss
use stdlib::rss::parse;
```

## Functions

| Function | Description |
| --- | --- |
| [`is_int_literal_base`](#is-int-literal-base) | Returns whether a string is a valid integer literal for the given base. |
| [`is_int_literal`](#is-int-literal) | Returns whether a string is a base-10 integer literal. |
| [`try_parse_int_base`](#try-parse-int-base) | Parses an integer literal for the given base and returns null on failure. |
| [`try_parse_int`](#try-parse-int) | Parses a base-10 integer literal and returns null on failure. |
| [`parse_int_base_or`](#parse-int-base-or) | Parses an integer literal for the given base or returns a fallback. |
| [`parse_int_or`](#parse-int-or) | Parses a base-10 integer literal or returns a fallback. |
| [`is_bool_literal`](#is-bool-literal) | Returns whether a string is a boolean literal. |
| [`try_parse_bool`](#try-parse-bool) | Parses a boolean literal and returns null on failure. |
| [`parse_bool_or`](#parse-bool-or) | Parses a boolean literal or returns a fallback. |

## Function details

### `is_int_literal_base`

```rss
pub fn is_int_literal_base(value: string, base: int) -> bool
```

Returns whether a string is a valid integer literal for the given base.

### `is_int_literal`

```rss
pub fn is_int_literal(value: string) -> bool
```

Returns whether a string is a base-10 integer literal.

### `try_parse_int_base`

```rss
pub fn try_parse_int_base(value: string, base: int) -> int?
```

Parses an integer literal for the given base and returns null on failure.

### `try_parse_int`

```rss
pub fn try_parse_int(value: string) -> int?
```

Parses a base-10 integer literal and returns null on failure.

### `parse_int_base_or`

```rss
pub fn parse_int_base_or(value: string, base: int, fallback: int) -> int
```

Parses an integer literal for the given base or returns a fallback.

### `parse_int_or`

```rss
pub fn parse_int_or(value: string, fallback: int) -> int
```

Parses a base-10 integer literal or returns a fallback.

### `is_bool_literal`

```rss
pub fn is_bool_literal(value: string) -> bool
```

Returns whether a string is a boolean literal.

### `try_parse_bool`

```rss
pub fn try_parse_bool(value: string) -> bool?
```

Parses a boolean literal and returns null on failure.

### `parse_bool_or`

```rss
pub fn parse_bool_or(value: string, fallback: bool) -> bool
```

Parses a boolean literal or returns a fallback.
