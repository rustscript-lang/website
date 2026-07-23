# VM and compiler

## VM

`pd-vm` executes compiled bytecode. Its runtime supports synchronous and asynchronous execution, real script call frames, first-class callable values, exported and queued callbacks, debugger-facing state, recording and replay, type metadata, regex caching, fuel, epoch interruption, and trace-JIT hooks.

## Compiler

The compiler accepts RSS source and produces program metadata plus bytecode. The implementation separates source frontends, parsing, IR, type information, code generation, assembler support, host-call handling, and artifact encoding. Script functions and closures lower into function regions, callable prototypes, capture metadata, root bindings, and `callvalue`/`ret` control flow. Generic function references, captured and escaping closures, recursive calls, callable collections, and exported callback schemas are covered by compiler and runtime tests. The [Callables and Closures](/docs/reference/rss/callables-and-closures/) reference describes the language surface.

## Public versus internal contracts

The RSS language reference documents syntax and observable behavior. VMBC, debugger, host-function, callable/callback, and embedding contracts belong in reference pages. Parser layout, IR layout, VM frame handling, JIT trace representation, and compiler passes belong to contributor work.
