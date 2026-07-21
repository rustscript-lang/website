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

### Short script-function inlining

When the recorder encounters `callvalue` while compiling a hot parent trace, it can merge one short script function into the parent's SSA trace. Inlining has no separate call-count threshold: the parent loop, exit, or continuation must first become hot. The default hot-loop threshold is 8.

There is no dedicated function-inlining switch or inline-specific hotness threshold. Setting `JitConfig.enabled` to `false` disables the entire Trace JIT, including function inlining. `hot_loop_threshold` controls when the parent trace becomes eligible, while `max_trace_len` only supplies the shared trace budget. The one-level inline depth, 32-instruction limit, and 8-local limit below are fixed implementation bounds rather than public `JitConfig` fields. The command-line runner likewise has no inline-specific flag.

The call site is eligible only when all of these conditions hold:

- The caller is the root frame. Calls made from a callable frame are not currently inlined.
- The callable value can be traced to a root local with exactly one static callable binding.
- The callable prototype observed in that local at trace entry matches the statically selected prototype. A changed target follows the regular `callvalue` path.
- The target is an uncaptured `FunctionItem` backed by a RustScript `ScriptFunction`; closures, captured functions, and host callables are excluded.
- The call arity, prototype arity, and parameter-slot metadata agree.
- The target is not recursive, and the recorder is not already inside another inlined function. Current inline depth is one.
- The callee and parent together fit within `max_trace_len`, whose default is 256 decoded operations.

The callee body must also satisfy these bounds:

- At most 32 decoded instructions, including the final `ret`.
- At most 8 distinct local slots read or written.
- Exactly one `ret`, at the end of the function region.
- Forward `br` and `brfalse` targets may stay within the region. Backward branches, and therefore callee loops, are rejected.
- Nested `callvalue` is rejected. A bytecode `call` is accepted only for a recognized builtin with valid arity; final recorder and native-lowering support is still required.

If the callable has no schema, it needs no argument-schema guard. With a callable schema, parameter count must match and every parameter must either be proven by the recorded SSA representation or support a runtime type guard. Current guards cover `int`, `float`, `bool`, `string`, `bytes`, arrays, and map/object-like values. `Unknown` and generic parameters impose no guard. `null`, `number`, `optional`, and callable parameter schemas currently reject inlining. A failed runtime guard exits at the original `callvalue` instruction so the interpreter performs the call.

Call-site target profiles and inline counters are exposed for diagnostics, but profile observation counts do not add another admission threshold. Native trace entry and inherited-state handoff are also suppressed while the active frame has shared `Borrow` or `BorrowMut` capture cells, since those cells are authoritative over raw local snapshots.

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
