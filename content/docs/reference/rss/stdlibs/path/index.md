<!-- docs-title: path -->

`stdlib::rss::path`

Portable path separator, joining, basename, directory, and extension helpers.

## Import

```rss
use stdlib::rss::path;
```

## Functions

| Function | Description |
| --- | --- |
| [`normalize_sep`](#normalize-sep) | Replaces backslashes with forward slashes in a path. |
| [`join`](#join) | Joins two path segments with a single separator. |
| [`basename`](#basename) | Returns the final path segment. |
| [`dirname`](#dirname) | Returns the parent directory portion of a path. |
| [`extname`](#extname) | Returns the file extension of a path. |

## Function details

### `normalize_sep`

```rss
pub fn normalize_sep(path: string) -> string
```

Replaces backslashes with forward slashes in a path.

### `join`

```rss
pub fn join(lhs: string, rhs: string) -> string
```

Joins two path segments with a single separator.

### `basename`

```rss
pub fn basename(path: string) -> string
```

Returns the final path segment.

### `dirname`

```rss
pub fn dirname(path: string) -> string
```

Returns the parent directory portion of a path.

### `extname`

```rss
pub fn extname(path: string) -> string
```

Returns the file extension of a path.
