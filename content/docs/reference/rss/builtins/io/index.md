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
| [`open`](#open) | Opens a file handle as an `io.file` resource, or returns the OS error text. |
| [`popen`](#popen) | Starts a child process and returns a process-backed `io.file` resource, or the OS error text. |
| [`read_all`](#read-all) | Reads all remaining text from an I/O handle, or returns the OS error text. |
| [`read_line`](#read-line) | Reads a single line from an I/O handle. End of file is `Result::Ok(None)`; a present but empty line is `Result::Ok(Some(""))`. |
| [`write`](#write) | Writes text to an I/O handle and returns the number of bytes written, or the OS error text. |
| [`flush`](#flush) | Flushes buffered output for an I/O handle, or returns the OS error text. |
| [`close`](#close) | Closes an I/O handle, consuming the resource, or returns the OS error text. A close failure is reported instead of being swallowed. |
| [`exists`](#exists) | Returns whether a file system path exists. |

## Function details

### `open`

```rss
fn open(path: string, mode: string) -> Result<io.file, string>
```

Opens a file handle as an `io.file` resource, or returns the OS error text.

### `popen`

```rss
fn popen(command: string, mode: string) -> Result<io.file, string>
```

Starts a child process and returns a process-backed `io.file` resource, or the OS error text.

### `read_all`

```rss
fn read_all(handle: io.file) -> Result<string, string>
```

Reads all remaining text from an I/O handle, or returns the OS error text.

### `read_line`

```rss
fn read_line(handle: io.file) -> Result<Option<string>, string>
```

Reads a single line from an I/O handle. End of file is `Result::Ok(None)`; a present but empty line is `Result::Ok(Some(""))`.

### `write`

```rss
fn write(handle: io.file, text: string) -> Result<int, string>
```

Writes text to an I/O handle and returns the number of bytes written, or the OS error text.

### `flush`

```rss
fn flush(handle: io.file) -> Result<(), string>
```

Flushes buffered output for an I/O handle, or returns the OS error text.

### `close`

```rss
fn close(handle: io.file) -> Result<(), string>
```

Closes an I/O handle, consuming the resource, or returns the OS error text. A close failure is reported instead of being swallowed.

### `exists`

```rss
fn exists(path: string) -> bool
```

Returns whether a file system path exists.
