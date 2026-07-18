<!-- docs-title: Global functions -->

`global`

Language-level builtins and default output functions available without an import.

These functions are available directly; no `use` declaration is required.

## Functions

| Function | Description |
| --- | --- |
| [`len`](#len) | Return the length of a string, array, or map. |
| [`slice`](#slice) | Slice a string from the given start and length. |
| [`concat`](#concat) | Concatenate two strings. |
| [`array_new`](#array-new) | Create an empty array. |
| [`array_push`](#array-push) | Append a value to an array and return the updated array. |
| [`map_new`](#map-new) | Create an empty map. |
| [`get`](#get) | Read a string entry. |
| [`has`](#has) | Check whether an array contains a valid index. |
| [`type`](#type) | Return the runtime type name of a value. |
| [`set`](#set) | Update an array entry and return the updated array. |
| [`keys`](#keys) | Return an array of container keys or indices. |
| [`count`](#count) | Return the number of entries in an array or map. |
| [`assert`](#assert) | Abort execution if the condition is false. |
| [`string_contains`](#string-contains) | Return true when `needle` is found within `text`. |
| [`string_replace_literal`](#string-replace-literal) | Replace non-overlapping literal `needle` matches in `text`. |
| [`string_lower_ascii`](#string-lower-ascii) | Lower ASCII `A`-`Z` bytes in `text` while preserving UTF-8. |
| [`string_split_literal`](#string-split-literal) | Split `text` on non-overlapping literal `delimiter` matches. |
| [`print`](#print) | Writes a value to the runtime print sink. |
| [`println`](#println) | Writes a value to the runtime print sink and appends a newline. |

## Function details

### `len`

```rss
fn len(text: string) -> int
```

```rss
fn len(items: array) -> int
```

```rss
fn len(items: bytes) -> int
```

```rss
fn len(entries: map) -> int
```

Return the length of a string, array, or map.

### `slice`

```rss
fn slice(text: string, start: int, length: int) -> string
```

```rss
fn slice(items: array, start: int, length: int) -> array
```

```rss
fn slice(items: bytes, start: int, length: int) -> bytes
```

Slice a string from the given start and length.

### `concat`

```rss
fn concat(left: string, right: string) -> string
```

```rss
fn concat(left: array, right: array) -> array
```

```rss
fn concat(left: bytes, right: bytes) -> bytes
```

Concatenate two strings.

### `array_new`

```rss
fn array_new() -> array
```

Create an empty array.

### `array_push`

```rss
fn array_push(items: array, value: any) -> array
```

Append a value to an array and return the updated array.

### `map_new`

```rss
fn map_new() -> map
```

Create an empty map.

### `get`

```rss
fn get(text: string, index: int) -> string
```

```rss
fn get(items: array, index: int) -> unknown
```

```rss
fn get(items: bytes, index: int) -> int
```

```rss
fn get(entries: map, key: any) -> unknown
```

Read a string entry.

### `has`

```rss
fn has(items: array, index: int) -> bool
```

```rss
fn has(items: bytes, index: int) -> bool
```

```rss
fn has(entries: map, key: any) -> bool
```

Check whether an array contains a valid index.

### `type`

```rss
fn type(value: any) -> string
```

Return the runtime type name of a value.

### `set`

```rss
fn set(items: array, index: int, value: any) -> array
```

```rss
fn set(entries: map, key: any, value: any) -> map
```

Update an array entry and return the updated array.

### `keys`

```rss
fn keys(items: array) -> array
```

```rss
fn keys(entries: map) -> array
```

Return an array of container keys or indices.

### `count`

```rss
fn count(items: array) -> int
```

```rss
fn count(entries: map) -> int
```

Return the number of entries in an array or map.

### `assert`

```rss
fn assert(condition: bool) -> null
```

Abort execution if the condition is false.

### `string_contains`

```rss
fn string_contains(text: string, needle: string) -> bool
```

Return true when `needle` is found within `text`.

### `string_replace_literal`

```rss
fn string_replace_literal(text: string, needle: string, replacement: string) -> string
```

Replace non-overlapping literal `needle` matches in `text`.

### `string_lower_ascii`

```rss
fn string_lower_ascii(text: string) -> string
```

Lower ASCII `A`-`Z` bytes in `text` while preserving UTF-8.

### `string_split_literal`

```rss
fn string_split_literal(text: string, delimiter: string) -> array
```

Split `text` on non-overlapping literal `delimiter` matches.

### `print`

```rss
fn print(value: any) -> any
```

Writes a value to the runtime print sink.

### `println`

```rss
fn println(value: any) -> any
```

Writes a value to the runtime print sink and appends a newline.
