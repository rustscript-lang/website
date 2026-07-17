# VM and compiler

## VM

`pd-vm` executes compiled bytecode. Its runtime supports synchronous and asynchronous execution, debugger-facing state, recording and replay, type metadata, regex caching, fuel, epoch interruption, and trace-JIT hooks.

## Compiler

The compiler accepts RSS source and produces program metadata plus bytecode. The implementation separates source frontends, parsing, IR, type information, code generation, assembler support, host-call handling, and artifact encoding.

## Public versus internal contracts

The RSS language reference documents syntax and observable behavior. VMBC, debugger, host-function, and embedding contracts belong in reference pages. Parser layout, IR layout, VM stack handling, JIT trace representation, and compiler passes belong to contributor work.

## Function values

The current development branch contains runtime coverage for function values and closures. Preserve their tested generic, capture, aliasing, and factory semantics while the artifact and embedding contracts are being completed. See [Function values](/docs/reference/function-values/).

## Source

RustScript README `Internals / VM Internals`, `Compiler Internals`, and `JIT Internals`, revision `9a4509b162fe4500fe91180f3e2ea9d0230df304`.
