# Stdlibs

Pure RustScript modules shipped with the runtime.

Stdlib modules are pure RustScript sources. Import a module with a path such as `use stdlib::rss::strings;`.

This section documents 129 public functions.

## Modules

| Module | Functions | Description |
| --- | ---: | --- |
| [`bytes`](./bytes/) | 11 | Byte-sequence slicing, comparison, searching, and integer encoding helpers. |
| [`collections`](./collections/) | 9 | Generic array and map helpers. |
| [`io`](./io/) | 4 | High-level text file operations built on the native `io` namespace. |
| [`iter`](./iter/) | 14 | Range, collection traversal, transformation, filtering, and reduction helpers. |
| [`lrucache`](./lrucache/) | 16 | A generic least-recently-used cache implemented in pure RustScript. |
| [`math`](./math/) | 54 | Numeric constants, predicates, arithmetic helpers, and transcendental functions. |
| [`parse`](./parse/) | 9 | Validated integer and boolean parsing helpers. |
| [`path`](./path/) | 5 | Portable path separator, joining, basename, directory, and extension helpers. |
| [`strings`](./strings/) | 7 | String comparison, searching, splitting, trimming, and replacement helpers. |
