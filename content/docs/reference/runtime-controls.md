# Runtime controls and artifacts

## REPL and debugger

Run the RSS REPL:

```bash
cargo run -p pd-vm --bin pd-vm-run -- --repl
```

Run the interactive debugger:

```bash
cargo run -p pd-vm --bin pd-vm-run -- --debug examples/example.rss
```

The debugger supports breakpoints, stepping, stack and local inspection, fuel, and epoch commands. Recording and replay use `--record` and `--view-record`.

## VMBC

Emit VMBC without executing the program:

```bash
cargo run -p pd-vm --bin pd-vm-run -- --emit-vmbc out/example.vmbc examples/example.rss
```

Disassemble a VMBC file with `--disasm-vmbc`; use `--show-source` when source is embedded.

## Fuel and epoch interruption

`Vm` and `Store<T>` expose fuel controls. The runner accepts `--fuel`, `--epoch-deadline`, and `--epoch-check-interval` to limit cooperative execution.

## JIT, WebAssembly, and no_std

The runner can report trace-JIT activity with `--jit-hot-loop` and `--jit-dump`. RustScript also has a WebAssembly runtime and a `no_std` runtime for constrained environments. The user-facing controls remain separate from compiler and JIT implementation details in the contributor documentation.

## Source

RustScript README `How To Use / REPL`, `Debugging`, `Recording and Replay`, `Bytecode and VMBC`, `JIT`, `Fuel Metering`, `Epoch Interruption`, `Wasm`, and `no_std`, revision `9a4509b162fe4500fe91180f3e2ea9d0230df304`.
