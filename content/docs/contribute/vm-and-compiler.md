# VM and compiler

## VM

`pd-vm` executes compiled bytecode. Its runtime supports synchronous and asynchronous execution, debugger-facing state, recording and replay, type metadata, regex caching, fuel, epoch interruption, and trace-JIT hooks.

## Compiler

The compiler accepts RSS source and produces program metadata plus bytecode. The implementation separates source frontends, parsing, IR, type information, code generation, assembler support, host-call handling, and artifact encoding. Current development coverage also exercises callable values and closures, including generic, capture, aliasing, and factory semantics; the [RSS language](/docs/reference/rss/#callable-development-status) describes their language surface.

## Public versus internal contracts

The RSS language reference documents syntax and observable behavior. VMBC, debugger, host-function, and embedding contracts belong in reference pages. Parser layout, IR layout, VM stack handling, JIT trace representation, and compiler passes belong to contributor work.
