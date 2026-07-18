# RustScript

[![rustscript on crates.io](https://img.shields.io/crates/v/rustscript.svg)](https://crates.io/crates/rustscript)

This repo contains the RustScript language implementation, VM/compiler core, standard library, examples, bytecode/AOT tooling, wasm runtime support, and debugger-facing runtime contract.

## Related projects

- RustScript core: https://github.com/rustscript-lang/rustscript
- RustScript Playground: https://github.com/rustscript-lang/playground
- IronRust: https://github.com/rustscript-lang/IronRust
- Edge runtime and ABI: https://github.com/rustscript-lang/pd-edge
- Controller: https://github.com/rustscript-lang/pd-controller
- Compatibility frontends (Lua, JavaScript): https://github.com/rustscript-lang/rustscript-compat-frontends

## Crate usage

Consumers can refer to the VM crate from this repository:

```toml
rustscript = "0.22.2"
pd-vm = { git = "https://github.com/rustscript-lang/rustscript", package = "pd-vm" }
pd-host-function = { git = "https://github.com/rustscript-lang/rustscript", package = "pd-host-function" }
```

## Test

```bash
cargo test --workspace
cargo build --workspace --release
```

`pd-vm` is a stack-based virtual machine plus compiler toolchain. It includes the RustScript (`.rss`) frontend and exposes a source-plugin API for compatibility languages such as JavaScript and Lua.

## Documentation

### Tools and runtime use

- [pd-vm-run](./pd-vm-run/) — released binary, REPL, formatting, VMBC, recordings, and runtime flags.
- [Debugger](./debugger/) — stdio/TCP debugging and recording replay commands.
- [Cooperative Scheduling](./cooperative-scheduling/) — fuel, epoch, yield reasons, and resume rules.
- [Playground](./playground/) — Monaco, wasm lint, and browser execution.

### Implementation reference

- [Bytecode](./bytecode/) — `Program`, `TypeMap`, opcodes, VMBC, assembler, and embedded execution.
- [VM API](./vm-api/) — categorized Rust APIs for VM lifecycle, `Store`, callbacks, host operations, limits, and diagnostics.
- [Compiler](./compiler/) — frontend-independent IR, type validation, lifetime/liveness lowering, and bytecode lowering.
- [JIT and AOT](./jit-aot/) — native backends, artifacts, coverage, diagnostics, and NYI boundaries.

- [Compiler frontend syntax and feature support](https://github.com/rustscript-lang/rustscript/tree/master/src/compiler/frontends)


## Overview

Executes compiled compact bytecode rather than interpreting source.
Offers consistent runtime semantics for both synchronous and asynchronous execution.
Includes rich debugging and profiling tools: interactive debugger, recording and replay, and JIT trace insights.
Emits compile-time type metadata that the interpreter and trace JIT use for typed fast paths and
clearer compile diagnostics. RustScript now treats that metadata as required compiler output rather
than optional hints.
## TODO

- [ ] Rust-like Option/Result support.
- [ ] Epoch check should be only on loop start or function call, instead of per interval.
- [ ] host call fuel budgeting.
- [ ] Callable-as-value support.
