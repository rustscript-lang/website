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
| [`read_text`](#read-text) | Reads an entire file into a string, or returns the IO error. |
| [`write_text`](#write-text) | Writes text to a file, replacing any existing contents, and returns the bytes written or the IO error. |
| [`append_text`](#append-text) | Appends text to the end of a file and returns the bytes written or the IO error. |
| [`read_lines`](#read-lines) | Reads a file and splits it into newline-delimited lines, or returns the IO error. |

## Function details

### `read_text`

```rss
pub fn read_text(path: string) -> Result<string, string>
```

Reads an entire file into a string, or returns the IO error.

### `write_text`

```rss
pub fn write_text(path: string, text: string) -> Result<int, string>
```

Writes text to a file, replacing any existing contents, and returns the bytes written or the IO error.

### `append_text`

```rss
pub fn append_text(path: string, text: string) -> Result<int, string>
```

Appends text to the end of a file and returns the bytes written or the IO error.

### `read_lines`

```rss
pub fn read_lines(path: string) -> Result<[string], string>
```

Reads a file and splits it into newline-delimited lines, or returns the IO error.
