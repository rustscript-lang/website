<!-- docs-title: Development and tooling -->


## How To Use

### Run Programs

Run with the VM runner binary:

```powershell
cargo run -p pd-vm --bin pd-vm-run -- --fuel 100000 examples/example.rss
```

Compatibility frontends such as JavaScript and Lua are provided by source-plugin crates. Use `CompileSourceFileOptions::with_source_plugin(...)` when compiling those files from an embedding crate.

### REPL

RustScript REPL (history + multiline support):

```powershell
cargo run -p pd-vm --bin pd-vm-run -- --repl
```


### Debugging

Run with interactive `pdb` debugger on stdio:

```powershell
cargo run -p pd-vm --bin pd-vm-run -- --debug examples/example.rss
```

Run debugger over TCP:

```powershell
cargo run -p pd-vm --bin pd-vm-run -- --debug --tcp 127.0.0.1:9002 examples/example.rss
```

Useful commands: `break`, `break line`, `step`, `next`, `out`, `stack`, `locals`, `where`, `continue`, `fuel`, `epoch`.

### Recording and Replay

Record execution:

```powershell
cargo run -p pd-vm --bin pd-vm-run -- --record out/example.pdr examples/example.rss
```

Replay execution:

```powershell
cargo run -p pd-vm --bin pd-vm-run -- --view-record out/example.pdr
```

Replay supports `break`, `break line`, `continue`, `step`, `next`, `out`, `stack`, `locals`,
`print`, `ip`, `where`, and `funcs`. In replay mode, breakpoints set pause points in the replay
stream instead of runtime VM breakpoints.

### Bytecode and VMBC

Emit VMBC wire-format output without running:

```powershell
cargo run -p pd-vm --bin pd-vm-run -- --emit-vmbc out/example.vmbc examples/example.rss
```

Disassemble VMBC:

```powershell
cargo run -p pd-vm --bin pd-vm-run -- --disasm-vmbc path/to/program.vmbc
```

Disassemble with embedded source (if present):

```powershell
cargo run -p pd-vm --bin pd-vm-run -- --disasm-vmbc path/to/program.vmbc --show-source
```

### JIT

Dump trace-JIT activity:

```powershell
cargo run -p pd-vm --bin pd-vm-run -- --jit-hot-loop 2 --jit-dump examples/example.rss
```

Native JIT codegen uses Cranelift.

- Cranelift is part of the Bytecode Alliance/Wasmtime ecosystem
- NYI behavior is shared by the trace recorder (`TraceJitEngine`) and is backend-independent.
- Some operations may use helper fallback paths internally, but that is not counted as trace-recorder NYI.
- Backward `brfalse` can stay inside a trace as a `LoopIfFalse` back-edge when the target already
  exists in the recorded trace; backward targets outside the trace still become side exits.

Library hooks:

- `vm.set_jit_config(...)`
- `vm.jit_snapshot()`
- `vm.dump_jit_info()`
- `vm.jit_native_trace_count()`
- `vm.jit_native_exec_count()`

### Regex Cache

Each `Vm` keeps a private LRU cache of compiled regular expressions used by the
`re::match`, `re::find`, `re::replace`, `re::split`, and `re::captures` builtins.
The default capacity is 512 entries. Rust embedding code can inspect or change
the capacity directly on the VM:

```rust
let mut vm = Vm::new(program);

assert_eq!(vm.regex_cache_capacity(), 512);
vm.set_regex_cache_capacity(128);

// Capacity zero clears existing entries and disables regex caching.
vm.set_regex_cache_capacity(0);
```

Reducing the capacity evicts least-recently-used entries immediately. Cache
statistics are available through `regex_cache_entry_count()`,
`regex_cache_compile_count()`, and `regex_cache_hit_count()`.

### Script Call Depth

Desktop and `no_std` VMs default to 1024 simultaneously active script call
frames. Embedders can inspect or change the positive limit per VM:

```rust
let mut vm = Vm::new(program);
assert_eq!(vm.max_script_call_depth(), 1024);
vm.set_max_script_call_depth(256)?;
```

`pd-vm-run --max-call-depth 256 script.rss` applies the same limit from the
CLI. A value of zero is rejected. Exceeding the configured limit returns
`VmError::CallStackOverflow`.

### Fuel Metering

`pd-vm` provides Wasmtime-style fuel controls on both `Vm` and `Store<T>`:

- `set_fuel`
- `set_fuel_check_interval`
- `fuel_check_interval`
- `get_fuel`
- `consume_fuel`
- `consume_fuel_tick`
- `add_fuel` / `recharge_fuel` (`Store::recharge`)
- `fuel_checkpoint` / `checkpoint`
- `restore_fuel` / `restore_checkpoint`

`Store<T>` is a lightweight wrapper around `Vm` plus host context data (`data()` / `data_mut()`),
and forwards `run()` / `resume()`.

`pd-vm-run` supports `--fuel <n>` to set the initial VM fuel budget.
`pd-vm-run` also supports `--epoch-deadline <n>` plus `--epoch-check-interval <n>` for
Wasmtime-style epoch interruption.

Debugger fuel commands:

- `fuel` (show remaining fuel and check interval)
- `fuel set <n>`
- `fuel add <n>`
- `fuel clear`
- `fuel interval [n]`

Example:

```rust
use vm::{Store, VmStatus};

// ... create vm ...
let mut store = Store::from_vm(vm);
store.set_fuel(10_000);
store.set_fuel_check_interval(1)?; // exact mode: check every instruction/trace op
let checkpoint = store.checkpoint();

loop {
    match store.run()? {
        VmStatus::Halted => break,
        VmStatus::Yielded => continue,
        VmStatus::Waiting(_) => {
            store.vm_mut().wait_for_host_op_blocking()?;
        }
    }
}

store.recharge(1_000)?;
store.restore_checkpoint(checkpoint);
```

Fuel charging semantics:

- Fuel metering is disabled by default (`get_fuel() == None`).
- Fuel metering and epoch interruption are mutually exclusive. Enabling one disables or rejects the
  other API surface, depending on the operation.
- `set_fuel` sets an explicit budget; `add_fuel` also enables metering if it was disabled.
- Fuel is consumed in chunks at the configured check cadence.
  Chunk size = `fuel_check_interval`.
  Default interval is `1` (exact mode).
- The interpreter applies fuel checks in the VM loop before opcode fetch/execute.
- Trace-JIT execution applies the same cadence against recorded trace ops/blocks.
- When fuel metering is enabled, native JIT execution injects fuel checks in generated machine
  code at the configured check cadence.
- With interval `> 1`, out-of-fuel detection is coarse-grained: execution may run up to
  `interval - 1` extra instructions before the next fuel check.
- If there is not enough fuel, execution returns `VmStatus::Yielded` before the next instruction
  runs (instruction pointer is not advanced). Top up fuel (`set_fuel` / `add_fuel`) and call
  `run()` / `resume()` again.
- `FuelCheckpoint` snapshots only fuel-accounting state (remaining budget, check interval, and
  current check-phase cursor). Restoring a checkpoint does not rewind VM stack, locals, or
  instruction pointer.
- Host-side work is not automatically metered beyond VM instruction execution; host code can call
  `consume_fuel` explicitly for additional charging policy.

### Epoch Interruption

`pd-vm` also provides a Wasmtime-style epoch API:

- `epoch_handle`
- `current_epoch`
- `increment_epoch` / `increment_epoch_by`
- `set_epoch_deadline`
- `clear_epoch_deadline`
- `epoch_deadline`
- `set_epoch_check_interval`
- `epoch_check_interval`
- `epoch_checkpoint` / `restore_epoch`
- `last_yield_reason`

Semantics:

- `EpochHandle` is shared engine-style state. Callers advance it externally.
- The epoch unit is an abstract tick, not wall-clock time by itself.
- `set_epoch_deadline(n)` arms the VM to yield once `current_epoch >= current_epoch_at_arm + n`.
- Epoch interruption reuses `VmStatus::Yielded`; inspect `last_yield_reason()` if the caller needs
  to distinguish fuel vs epoch vs host yields.
- After an epoch yield, the next `run()` / `resume()` automatically re-arms the same deadline delta.
  Use `epoch deadline <n>` to change the slice size or `epoch clear` to disable interruption.
- The interpreter and native JIT use the same inline checkpoint cadence (`epoch_check_interval`).

Debugger epoch commands:

- `epoch` (show current epoch, deadline, and check interval)
- `epoch tick [n]`
- `epoch deadline <n>`
- `epoch clear`
- `epoch interval [n]`

### Wasm Lint

Compiler-only wasm build (without runtime/JIT/debugger/CLI):

```powershell
cargo check -p pd-vm --target wasm32-unknown-unknown --no-default-features
```

Browser/editor lint integration is provided by sibling crate `pd-vm-wasm` via
`lint_source_json`.

The wasm linter reports both parse errors and compile-time type errors with Monaco-friendly line
and span metadata. That includes inferred-type failures such as incompatible `if`/`else` branch
merges.

### Wasm Runtime Playground

Runtime-enabled wasm build (without native JIT backend):

```powershell
cargo check -p pd-vm --target wasm32-unknown-unknown --no-default-features --features runtime
```

Browser playground wasm runtime is provided by sibling crate `pd-vm-wasm` built with the
`runtime` feature via:

- `lint_source_json`
- `run_source_json`

### `no_std` Embedded Runtime

The sibling crate [`pd-vm-nostd`](pd-vm-nostd) provides the VMBC v9 decoder and compact interpreter
using only `core` and `alloc`. It supports direct bytecode execution, script call frames and callable
values, synchronous host callbacks, and instruction fuel while leaving source compilation, CLI,
debugger, JIT/AOT, async host operations, and operating-system integrations in `pd-vm`.

RP2040 compile check:

```bash
rustup target add thumbv6m-none-eabi
cargo check -p pd-vm-nostd --target thumbv6m-none-eabi
```

Compile `.rss` source to VMBC on a host, then load that VMBC through `pd_vm_nostd` on the target.
The PlatformIO Arduino-Pico integration lives in
[`micro-rustscript`](https://github.com/rustscript-lang/micro-rustscript).

### Web Playground

The Monaco browser playground lives in a standalone repository:

- source: https://github.com/rustscript-lang/playground
- published site: https://rustscript-lang.github.io/playground/

It builds `pd-vm-wasm --features runtime`, copies wasm artifacts into the web app, and uses the Monaco grammar assets kept under `editor-assets/monaco`.

In browser epoch mode, the playground drives one epoch tick from a 1ms JavaScript timer and shows
the live epoch counter in the interruption panel. Timer delivery still depends on the main thread,
so compute-only wasm cannot be preempted mid-call while the browser is busy running the VM.

### Test and Perf Commands

Integration example tests:

```powershell
cargo test -p pd-vm --test example_tests
```

Manual perf characterization (ignored by default):

```powershell
cargo test -p pd-vm --test jit_tests perf_ -- --ignored --nocapture
```

Migration perf record (handwritten vs Cranelift baseline before handwritten backend removal):

- https://rustscript.org/docs/jit-backend-migration-perf-2026-03-06/
