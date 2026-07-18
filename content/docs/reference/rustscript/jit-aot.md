<!-- docs-title: JIT and AOT -->

RustScript has two native code-generation paths built on Cranelift: whole-program AOT compilation and hot-loop Trace JIT compilation.

## Backend overview

| Backend | Compilation unit | Entry policy |
|---|---|---|
| AOT | Whole bytecode control-flow graph | Explicitly compiled or loaded before execution. |
| Trace JIT | A recorded hot loop | Compiled after a loop reaches the configured threshold. |

Both paths consume typed `Program` metadata and preserve interpreter-visible VM semantics.

## AOT

AOT lowers the bytecode CFG into native segments. The VM API includes:

- `compile_aot()`
- `clear_aot()`
- `has_aot_program()`
- `aot_exec_count()`
- `encode_aot_artifact()`
- `save_aot_artifact_to_file(path)`
- `load_aot_artifact(bytes)`
- `load_aot_artifact_from_file(path)`
- `new_from_aot_artifact_with_jit_config(...)`
- `new_from_aot_artifact_file_with_jit_config(...)`

Use the released binary to compile, save, load, and inspect AOT execution:

```powershell
pd-vm-run --aot --aot-dump examples/example.rss
pd-vm-run --aot --aot-save out/example.pat examples/example.rss
pd-vm-run --aot-load out/example.pat
```

Artifacts are validated against the program cache key before installation.

## Trace JIT

Trace JIT follows a LuaJIT-style hot-loop model:

1. Detect a hot bytecode loop head.
2. Record a trace from the hot root.
3. Track symbolic stack and local state.
4. Build `JitTrace` and SSA form.
5. Specialize supported operations.
6. Emit native machine code and invoke it from the VM.

A backward `brfalse` can remain inside a trace as a loop back-edge when its target already exists in the recorded trace. Backward targets outside the trace become side exits.

Configure or inspect tracing with:

- `vm.set_jit_config(...)`
- `vm.jit_snapshot()`
- `vm.dump_jit_info()`
- `vm.jit_native_trace_count()`
- `vm.jit_native_exec_count()`

```powershell
pd-vm-run --jit-hot-loop 2 --jit-dump examples/example.rss
```

## Lowering status terms

- **Inline**: dedicated native lowering with no runtime bridge on the fast path.
- **Helper**: native code calls a narrow helper while remaining in compiled execution.
- **Bridge/Exit**: execution uses the runtime call path or leaves the trace around the operation.
- **NYI**: the backend does not currently lower the operation or trace shape.

## Current operation coverage

| Operator family | AOT | Trace JIT |
|---|---|---|
| Typed numeric `+`, `-`, `*`, `/`, `%`, unary `-` | Inline | Inline |
| Typed numeric `==`, `<`, `>` | Inline | Inline |
| `<<` | Inline | Inline |
| `>>`, `>>>` | Inline | Inline |
| Eager `and`, `or`, `not` opcodes | Inline | Inline |
| Short-circuit `&&`, `||` source forms | Lowered as branches, then compiled | Lowered as branches, then traced |

| Builtin or container operation | AOT | Trace JIT |
|---|---|---|
| String/bytes concat | Inline | Inline |
| `len`, `get`, `slice` on string/bytes | Inline | Inline |
| `bytes::from_array_u8`, `bytes::to_array_u8` | Inline | Inline |
| `len(array)` | Bridge/Exit | Inline |
| `get(array)` | Bridge/Exit | Inline for scalar values; Helper for heap values |
| `has(array)` | Bridge/Exit | Inline |
| `len(map)` | Bridge/Exit | Inline |
| `get(map)`, `has(map)` | Bridge/Exit | Helper |
| Selected string and regex helpers | Bridge/Exit | Helper |
| Dynamic type/string/equality operations | Bridge/Exit | Helper when specialized |
| Other builtins | Bridge/Exit | Bridge/Exit or NYI |
| Host imports | Bridge/Exit | Bridge/Exit or branch exit; never inline |

## Current NYI boundaries

Trace-JIT-wide NYI includes:

- traces longer than the configured maximum trace length
- unsupported opcodes or unsupported recorder/lowering shapes
- native targets outside `x86_64` Windows, `x86_64` Unix excluding macOS, `aarch64` Linux, and `aarch64` macOS

An NYI record means the trace backend declined native lowering. It does not imply that the interpreter lacks the operation. Unsupported traces continue through interpreter, bridge, or side-exit behavior according to the recorded shape.

Some operations use helper fallback paths without being classified as recorder NYI. The distinction is visible in JIT diagnostics and bridge counters.

## Fuel and epoch checks

Interpreter, Trace JIT, and generated native code use the same configured cooperative-check cadence. Native JIT inserts fuel or epoch checks into generated machine code. See [Cooperative Scheduling](../cooperative-scheduling/) for resume behavior.

## Diagnostics and performance characterization

Enable native bridge counters before collecting a JIT snapshot:

- `set_jit_native_bridge_stats_enabled(true)`
- `jit_native_bridge_stats_snapshot()`
- `clear_jit_native_bridge_stats()`

Manual performance characterization remains ignored by default:

```powershell
cargo test -p pd-vm --test jit_tests perf_ -- --ignored --nocapture
```
