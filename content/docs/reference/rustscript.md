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

## Contents

- [Overview](#overview)
- [TODO](#todo)
- [How To Use](#how-to-use)
  - [Run Programs](#run-programs)
  - [REPL](#repl)
  - [Debugging](#debugging)
  - [Recording and Replay](#recording-and-replay)
  - [Bytecode and VMBC](#bytecode-and-vmbc)
  - [JIT](#jit)
  - [Regex Cache](#regex-cache)
  - [Script Call Depth](#script-call-depth)
  - [Fuel Metering](#fuel-metering)
  - [Epoch Interruption](#epoch-interruption)
  - [Wasm Lint](#wasm-lint)
  - [Wasm Runtime Playground](#wasm-runtime-playground)
  - [`no_std` Embedded Runtime](#no_std-embedded-runtime)
  - [Web Playground](#web-playground)
  - [Test and Perf Commands](#test-and-perf-commands)
- [Internals](#internals)
  - [VM Internals](#vm-internals)
  - [Compiler Internals](#compiler-internals)
    - [Pipeline Layers](#pipeline-layers)
    - [Compiler APIs](#compiler-apis)
    - [Assembler API](#assembler-api)
    - [Builtins and Bridged call Opcode](#builtins-and-bridged-call-opcode)
    - [Current Compiler Subset Limitations](#current-compiler-subset-limitations)
  - [JIT Internals](#jit-internals)
- [Compiler frontend syntax and feature support](src/compiler/frontends/README.md)


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
