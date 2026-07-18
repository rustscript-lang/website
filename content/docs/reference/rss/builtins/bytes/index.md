<!-- docs-title: bytes -->

`bytes`

Binary bytes builtin namespace.

**Runtime support:** native and WebAssembly.

## Import

```rss
use bytes;
```

## Functions

| Function | Description |
| --- | --- |
| [`from_utf8`](#from-utf8) | Encodes a string as UTF-8 bytes. |
| [`to_utf8`](#to-utf8) | Decodes UTF-8 bytes into a string. |
| [`to_utf8_lossy`](#to-utf8-lossy) | Decodes bytes into a string using UTF-8 replacement semantics. |
| [`from_hex`](#from-hex) | Decodes a hexadecimal string into bytes. |
| [`to_hex`](#to-hex) | Encodes bytes as lowercase hexadecimal. |
| [`from_base64`](#from-base64) | Decodes a base64 string into bytes. |
| [`to_base64`](#to-base64) | Encodes bytes as standard base64. |
| [`from_array_u8`](#from-array-u8) | Converts an array of ints in 0..=255 into bytes. |
| [`to_array_u8`](#to-array-u8) | Converts bytes into an array of ints in 0..=255. |

## Function details

### `from_utf8`

```rss
fn from_utf8(text: string) -> bytes
```

Encodes a string as UTF-8 bytes.

### `to_utf8`

```rss
fn to_utf8(payload: bytes) -> string
```

Decodes UTF-8 bytes into a string.

### `to_utf8_lossy`

```rss
fn to_utf8_lossy(payload: bytes) -> string
```

Decodes bytes into a string using UTF-8 replacement semantics.

### `from_hex`

```rss
fn from_hex(text: string) -> bytes
```

Decodes a hexadecimal string into bytes.

### `to_hex`

```rss
fn to_hex(payload: bytes) -> string
```

Encodes bytes as lowercase hexadecimal.

### `from_base64`

```rss
fn from_base64(text: string) -> bytes
```

Decodes a base64 string into bytes.

### `to_base64`

```rss
fn to_base64(payload: bytes) -> string
```

Encodes bytes as standard base64.

### `from_array_u8`

```rss
fn from_array_u8(values: array) -> bytes
```

Converts an array of ints in 0..=255 into bytes.

### `to_array_u8`

```rss
fn to_array_u8(payload: bytes) -> array
```

Converts bytes into an array of ints in 0..=255.
