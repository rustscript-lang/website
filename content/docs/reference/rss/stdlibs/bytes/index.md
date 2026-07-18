<!-- docs-title: bytes -->

`stdlib::rss::bytes`

Byte-sequence slicing, comparison, searching, and integer encoding helpers.

## Import

```rss
use stdlib::rss::bytes;
```

## Functions

| Function | Description |
| --- | --- |
| [`slice`](#slice) | Returns a byte slice. |
| [`equal`](#equal) | Returns whether two byte sequences are equal. |
| [`starts_with`](#starts-with) | Returns whether buf starts with prefix. |
| [`ends_with`](#ends-with) | Returns whether buf ends with suffix. |
| [`index_of`](#index-of) | Returns the first index of needle in buf, or -1 when it is absent. |
| [`push_u8`](#push-u8) | Appends a single u8 value to a byte sequence. |
| [`read_u8`](#read-u8) | Reads a u8 value at the given offset. |
| [`read_u16_be`](#read-u16-be) | Reads a big-endian u16 at the given offset. |
| [`read_u16_le`](#read-u16-le) | Reads a little-endian u16 at the given offset. |
| [`write_u16_be`](#write-u16-be) | Encodes a big-endian u16 value. |
| [`write_u16_le`](#write-u16-le) | Encodes a little-endian u16 value. |

## Function details

### `slice`

```rss
pub fn slice(buf: bytes, start: int, len: int) -> bytes
```

Returns a byte slice.

### `equal`

```rss
pub fn equal(lhs: bytes, rhs: bytes) -> bool
```

Returns whether two byte sequences are equal.

### `starts_with`

```rss
pub fn starts_with(buf: bytes, prefix: bytes) -> bool
```

Returns whether buf starts with prefix.

### `ends_with`

```rss
pub fn ends_with(buf: bytes, suffix: bytes) -> bool
```

Returns whether buf ends with suffix.

### `index_of`

```rss
pub fn index_of(buf: bytes, needle: bytes) -> int
```

Returns the first index of needle in buf, or -1 when it is absent.

### `push_u8`

```rss
pub fn push_u8(buf: bytes, value: int) -> bytes
```

Appends a single u8 value to a byte sequence.

### `read_u8`

```rss
pub fn read_u8(buf: bytes, offset: int) -> int
```

Reads a u8 value at the given offset.

### `read_u16_be`

```rss
pub fn read_u16_be(buf: bytes, offset: int) -> int
```

Reads a big-endian u16 at the given offset.

### `read_u16_le`

```rss
pub fn read_u16_le(buf: bytes, offset: int) -> int
```

Reads a little-endian u16 at the given offset.

### `write_u16_be`

```rss
pub fn write_u16_be(value: int) -> bytes
```

Encodes a big-endian u16 value.

### `write_u16_le`

```rss
pub fn write_u16_le(value: int) -> bytes
```

Encodes a little-endian u16 value.
