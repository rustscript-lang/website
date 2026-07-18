# Builtins

Functions supplied directly by the compiler and VM runtime.

Builtin namespaces are supplied by the compiler and VM. Global functions require no import; named namespaces use declarations such as `use math;`.

This section documents 99 public functions.

## Modules

| Module | Functions | Description |
| --- | ---: | --- |
| [`Global functions`](./global/) | 19 | Language-level builtins and default output functions available without an import. |
| [`bytes`](./bytes/) | 9 | Binary bytes builtin namespace. |
| [`io`](./io/) | 8 | I/O builtin namespace. |
| [`re`](./re/) | 5 | Regex builtin namespace. |
| [`json`](./json/) | 2 | JSON builtin namespace. |
| [`jit`](./jit/) | 8 | JIT control builtin namespace. |
| [`math`](./math/) | 46 | Numeric math builtin namespace. |
| [`runtime`](./runtime/) | 2 | Default controls for sleeping and terminating the current VM invocation. |
