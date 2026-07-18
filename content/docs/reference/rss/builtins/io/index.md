<!-- docs-title: io -->

`io`

I/O builtin namespace.

**Runtime support:** native runtimes.

## Import

```rss
use io;
```

## Functions

| Function | Description |
| --- | --- |
| [`open`](#open) | Opens a file handle for runtime I/O. |
| [`popen`](#popen) | Starts a child process and returns a process-backed handle. |
| [`read_all`](#read-all) | Reads all remaining text from an I/O handle. |
| [`read_line`](#read-line) | Reads a single line of text from an I/O handle. |
| [`write`](#write) | Writes text to an I/O handle. |
| [`flush`](#flush) | Flushes buffered output for an I/O handle. |
| [`close`](#close) | Closes an I/O handle. |
| [`exists`](#exists) | Returns whether a file system path exists. |

## Function details

### `open`

```rss
fn open(path: string, mode: string) -> int
```

Opens a file handle for runtime I/O.

### `popen`

```rss
fn popen(command: string, mode: string) -> int
```

Starts a child process and returns a process-backed handle.

### `read_all`

```rss
fn read_all(handle_id: int) -> string
```

Reads all remaining text from an I/O handle.

### `read_line`

```rss
fn read_line(handle_id: int) -> string
```

Reads a single line of text from an I/O handle.

### `write`

```rss
fn write(handle_id: int, text: string) -> int
```

Writes text to an I/O handle.

### `flush`

```rss
fn flush(handle_id: int) -> bool
```

Flushes buffered output for an I/O handle.

### `close`

```rss
fn close(handle_id: int) -> bool
```

Closes an I/O handle.

### `exists`

```rss
fn exists(path: string) -> bool
```

Returns whether a file system path exists.
