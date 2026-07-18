<!-- docs-title: io -->

`stdlib::rss::io`

High-level text file operations built on the native `io` namespace.

## Import

```rss
use stdlib::rss::io;
```

## Functions

| Function | Description |
| --- | --- |
| [`read_text`](#read-text) | Reads an entire file into a string. |
| [`write_text`](#write-text) | Writes text to a file, replacing any existing contents. |
| [`append_text`](#append-text) | Appends text to the end of a file. |
| [`read_lines`](#read-lines) | Reads a file and splits it into newline-delimited lines. |

## Function details

### `read_text`

```rss
pub fn read_text(path: string) -> string
```

Reads an entire file into a string.

### `write_text`

```rss
pub fn write_text(path: string, text: string) -> int
```

Writes text to a file, replacing any existing contents.

### `append_text`

```rss
pub fn append_text(path: string, text: string) -> int
```

Appends text to the end of a file.

### `read_lines`

```rss
pub fn read_lines(path: string) -> [string]
```

Reads a file and splits it into newline-delimited lines.
