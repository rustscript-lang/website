<!-- docs-title: VM and compiler internals -->


## Internals

### VM Internals

`Program` consists of:

- `constants: Vec<Value>`
- `code: Vec<u8>`
- `local_count: usize`
- `imports: Vec<HostImport>`
- `debug: Option<DebugInfo>`
- `type_map: Option<TypeMap>`

`TypeMap` currently contains:

- `operand_types: HashMap<usize, (ValueType, ValueType)>`
- `local_types: Vec<ValueType>`

`operand_types` is keyed by bytecode offset and records inferred operand pairs for emitted binary
ops/comparisons. The interpreter and trace recorder use it for typed int/float/string fast paths.
`local_types` is a post-lowering local-slot summary and is intentionally lossy: compiler-inserted
`null` clears and hidden frame slots can widen entries to `Unknown`/`Null`, so it should not be
treated as a source-level binding type table.

Bytecode format:

- 1 byte opcode
- little-endian operands (`u8`, `u16`, `u32`)
- absolute jump targets

Instruction set:

| Opcode | Mnemonic | Operands       | Stack effect                       |
|--------|----------|----------------|------------------------------------|
| 0x00   | `nop`    | -              | no change                          |
| 0x01   | `ret`    | -              | stop execution                     |
| 0x02   | `ldc`    | u32 index      | push constant                      |
| 0x03   | `add`    | -              | (a, b) -> (a + b)                  |
| 0x04   | `sub`    | -              | (a, b) -> (a - b)                  |
| 0x05   | `mul`    | -              | (a, b) -> (a * b)                  |
| 0x06   | `div`    | -              | (a, b) -> (a / b)                  |
| 0x07   | `neg`    | -              | (a) -> (-a)                        |
| 0x08   | `ceq`    | -              | (a, b) -> (a == b)                 |
| 0x09   | `clt`    | -              | (a, b) -> (a < b)                  |
| 0x0A   | `cgt`    | -              | (a, b) -> (a > b)                  |
| 0x0B   | `br`     | u32 target     | ip = target                        |
| 0x0C   | `brfalse`| u32 target     | pop bool; if false jump            |
| 0x0D   | `pop`    | -              | pop value                          |
| 0x0E   | `dup`    | -              | dup top of stack                   |
| 0x0F   | `ldloc`  | u8 index       | push local                         |
| 0x10   | `stloc`  | u8 index       | pop -> local                       |
| 0x11   | `call`   | u16 id, u8 argc| pop args, call host, push returns  |
| 0x12   | `shl`    | -              | (a, b) -> (a << b)                 |
| 0x13   | `shr`    | -              | (a, b) -> (a >> b)                 |
| 0x14   | `mod`    | -              | (a, b) -> (a % b)                  |
| 0x15   | `and`    | -              | (a, b) -> (a && b)                 |
| 0x16   | `or`     | -              | (a, b) -> (a \|\| b)               |

Host calls and resuming:

The `call` opcode pops its arguments, dispatches to a builtin or bound host function via
`Vm::execute_host_call`, and handles three distinct outcomes:

| `CallOutcome` | Meaning | IP after suspension | Stack after suspension |
|---|---|---|---|
| `Return(values)` | Synchronous result | Advanced past `call` | Return values pushed |
| `Yield` | Retry next `run()` | **Rewound to `call` opcode** | **Args re-pushed** |
| `Pending(op_id)` | Async result pending | Advanced past `call` | Empty (result injected via `complete_host_op`) |

**Generated `#[pd_host_function]` binding selection:**

Default host functions declared with `#[pd_host_function]` are bound according to their Rust
signature:

| Signature shape | Generated binding | JIT behavior |
|---|---|---|
| Has a `Vm` parameter | `StaticStack` | VM-aware call boundary |
| Returns `CallOutcome`, `VmResult<CallOutcome>`, or `HostResult<CallOutcome>` | `StaticArgs` | General call boundary; may halt, yield, or become pending |
| Args-only with a supported ordinary return such as `Value`, `bool`, `String`, `Option<T>`, `VmResult<T>`, or `HostResult<T>` | `StaticNonYieldingArgs` | Eligible to remain inside a native loop trace |
| Unrecognized return shape | `StaticArgs` | Conservative fallback |

For a simple synchronous host function that always returns one value, prefer an ordinary return type
(or `VmResult<T>` / `HostResult<T>` when it may fail) instead of wrapping the value in
`CallOutcome::Return`. The ordinary signature communicates the non-yielding contract to the
generator and can avoid leaving an eligible native JIT loop trace. Use `CallOutcome` only when the
function needs `Halt`, `Yield`, `Pending`, or explicit control over the returned value count.

For example:

```rust
#[pd_host_function(name = "runtime::is_ready")]
fn runtime_is_ready() -> VmResult<bool> {
    Ok(true)
}
```

This signature selects `StaticNonYieldingArgs`. Changing its return type to
`VmResult<CallOutcome>` selects the general `StaticArgs` path because the signature no longer proves
that the function always returns one value synchronously.

**Non-yielding static host calls** — native-trace opt-in:

- `Vm::bind_static_non_yielding_args_function` and
  `Vm::register_static_non_yielding_args_function` let the trace JIT keep eligible host calls
  inside native traces.
- The function must return exactly one value via `CallOutcome::Return(CallReturn::One(...))`.
  Returning no value, `Halt`, `Yield`, or `Pending` is a contract violation and produces the same
  `VmError::HostError` in interpreted and native execution.
- Use the ordinary static args APIs when the host function may suspend, halt, or return no value.

**`CallOutcome::Yield`** — cooperative "retry me later":

- The VM re-pushes the original args onto the stack and rewinds `self.ip` to the start of the
  `call` opcode (`call_ip`). The next `run()` / `resume()` re-executes the entire `call` from
  scratch, re-popping args and re-invoking the host function.
- The host function must be idempotent with respect to yield (it will be called again).
- Returns `VmStatus::Yielded` with `last_yield_reason() == Some(VmYieldReason::Host)`.

**`CallOutcome::Pending(op_id)`** — async host operation:

- The VM advances `self.ip` past the `call` instruction (to `call_ip + 4`) and records
  `waiting_host_op = Some(op_id)`.
- Subsequent calls to `run()` immediately return `VmStatus::Waiting(op_id)` until the caller
  resolves the op via `vm.complete_host_op(op_id, values)` (which pushes return values) or via
  `vm.poll_waiting_host_op()` / `vm.await_waiting_host_op()`.

**Cooperative interruption yields (fuel / epoch)**:

- The fuel/epoch check fires in the interpreter loop **before** each opcode fetch, so no
  instruction is partially executed when a budget yield occurs. The IP is unchanged; refueling
  and calling `run()` again resumes from exactly the same instruction.
- A special case exists for the **fused `call; ret` tail pattern**: when the call immediately
  precedes `ret`, the VM consumes the trailing `ret` inline and charges an extra interrupt tick.
  If that extra tick fires an out-of-fuel/epoch error, it is caught and surfaced as
  `VmStatus::Yielded` after the call already completed and return values are on the stack. The
  IP at that point is past the `ret`, so the resumed `run()` halts cleanly.

**Context-switch safety invariant**:

There are two distinct suspension categories, each safe for a different reason:

1. **Host-driven suspension** (`CallOutcome::Yield` and `CallOutcome::Pending`) is only
   triggered from within `execute_host_call`, which is only reachable via the `call` opcode
   handler. Every other instruction either completes fully or returns a hard `VmError`, so
   host-driven suspension never interrupts a partially-executed instruction.

2. **Cooperative interruption** (fuel / epoch) fires at **any instruction boundary** — the
   check runs in the interpreter loop before the next opcode is fetched, so the VM can pause
   before an assignment, an arithmetic op, a branch, etc. This is safe because no instruction
   has started executing: the IP points at the unconsumed opcode and the stack is in a fully
   consistent state from the previous instruction's completion.

In both cases there is never a partially-executed instruction left in flight when the VM
suspends. If a new instruction or path ever needs to trigger a suspension, it must ensure the
stack and IP are fully coherent before doing so.

### Compiler Internals

#### Pipeline Layers

The end-to-end stack is split into layers. Not every entrypoint uses every layer (for example,
`compile_source()` skips module loading/linking), but this is the full model:

1. Module/source loading (`compile_source_file()` path)
1. Unit linking (`linker::merge_units`)
1. Frontend lowering (built-in `rustscript`, plus any registered source plugins)
1. Frontend-independent IR
1. Type-consistency validation on legalized IR (for example rejecting known `if`/`else` branch mismatches)
1. Lifetime/liveness lowering plus type metadata collection
1. Bytecode backend (`Compiler` + `Assembler` -> `Program`) executed by VM
1. Trace-JIT SSA recording (`JitTrace` + `SsaTrace`) with symbolic stack/local state
1. Native machine code emission and execution from SSA traces

#### Type Metadata and Inference

The compiler runs lightweight value-type inference before bytecode emission and records the result
into `Program.type_map` when metadata is available.

Current important behaviors:

- Known arithmetic on `int`/`int` stays `int`.
- Known mixed numeric arithmetic widens to `float`.
- `+` becomes string concatenation when either side is known `string`, so cases such as
  `"text" + 123` are recorded as string-concat operand metadata.
- Callable return types propagate through direct named calls, function-valued locals,
  closure-valued locals, and callable parameters when the callee can still be identified.
- `if`/`else` expression results and branch-local merges are rejected when both sides have
  different known concrete types. The compiler no longer keeps backward-compatible dynamic fallback
  behavior for those mismatches.

This inference is intentionally local and pragmatic. It exists to drive compile diagnostics and
monomorphic runtime fast paths, not to provide a full source-language static type system.


#### Compiler APIs

Use `compile_source()` for RustScript, or `compile_source_file()` for built-in `.rss` path loading. For compatibility languages, build options with `CompileSourceFileOptions::with_source_plugin(...)` and call `compile_source_file_with_options(...)`.

```text
fn print(x);
let x = 2 + 3;
let y = x * 4;
if y > 10 {
    print(y);
} else {
    0;
}
```

Closure subset example:

```text
let base = 7;
let add = |value| value + base;
add(5);
```

Compatibility frontends can lower equivalent closure forms through the source-plugin API.

Built-in print aliases (no declaration needed):

- RustScript: `print(value);`, `print("... {}", a);`, `println(value);`, `println("... {}", a);`
- Compatibility frontends may provide their own print aliases through plugin lowering.

Host calls must be explicitly imported:

- RustScript: `use runtime;`, `use http;`, `use rate_limit;`
- Compatibility frontends own their import syntax through `SourcePlugin::parse_imports(...)` and `SourcePlugin::strip_imports(...)`.

#### Assembler API

Use `assemble()` to parse text assembly into a `Program`.

Data declarations:

- `const NAME VALUE`
- `string NAME "..."`

```text
.data
const two 2
string greeting "hello"
.code
.local counter
.label loop
ldc two
stloc counter
ldloc counter
ldc 1
sub
dup
stloc counter
brfalse done
br loop
.label done
ldc greeting
ret
```

Directives:

- `.data` and `.code` switch sections
- `.label NAME` defines a jump label
- `.local NAME [INDEX]` defines a named local


#### Host Calls and Callable Values

The compiler keeps direct host dispatch separate from script callable dispatch.

1. Builtin calls (fixed reserved indices)
   - Builtins use `BuiltinFunction::call_index()`.
   - Parser lowering emits these for helpers such as `len`, `get`, `set`, `slice`, `count`,
     `type_of`, `assert`, and `io::*`/`re::*`/`json::*`/`jit::*`.
2. Runtime host imports (per-program remapped indices)
   - Runtime imports are remapped to dense import slots (`call_index_remap`).
   - Direct calls are emitted as `call <slot>, <argc>`.
   - Host functions used as values are Program-owned callable prototypes and execute through
     `callvalue <argc>`.
3. RustScript function items and closures
   - Every script body is emitted once in a function region.
   - Named functions and closure evaluations produce callable values; script invocation uses
     `callvalue <argc>` and a real execution frame.
   - `ret` completes the active typed continuation: root halt, caller resume, or host return.

At runtime, direct `call` uses `Vm::execute_host_call`, while `callvalue` validates the callable's
prototype, schema, arity, and frame layout before dispatch. VMBC v9 carries the
script-function, prototype, function-region, and root-binding tables. See
[`docs/callable-runtime.md`](docs/callable-runtime.md) for the bytecode, lifecycle, callback, and
optimized-backend contracts.

#### Current Compiler Subset Limitations

Core compiler/IR:

- callable locals can be passed, returned, called, and stored as array or map values
- callable values cannot be used as map keys or serialized as constants
- callable return-type inference propagates through direct named calls, callable locals, closures,
  and callable parameters when the compiler can identify a compatible signature
- known `if`/`else` expression results and branch-local merges with incompatible concrete types are
  compile errors
- RustScript uses explicit nullable schemas such as `int?` and `Profile?`; non-optional declared
  locals and returns reject `null`
- in RustScript, optional chaining requires a user-declared schema on the container; the result
  stays optional until handled with `.unwrap_or(...)`, a `!= null` refinement, or a `match` arm
  that binds `Some(name)`
- after optional handling, the compiler and wasm lint keep the concrete inner type instead of
  degrading back to `unknown`
- direct and mutual recursion are supported with a 1,024-frame script recursion limit
- function declarations can be nested and implicitly capture outer locals at declaration time
- in RustScript move-semantics mode, implicit captures follow expression semantics (`x` may move, `x.copy()` copies, `&x`/`&mut x` capture borrowed views)
- `match` patterns are limited to int/string/null literals, `None`, `Some(name)`, `_`, and type constructors (`Some(TypeName)`)
- `break` and `continue` are only valid inside loops
- direct host namespace syntax uses named namespaces such as `runtime`, `http`, and `rate_limit` when the corresponding module is not present (builtin namespaces are `io::`, `re::`, `json::`, and `jit::`)

Module/source loading:

- `crate::...` module paths are not supported in RustScript source loading; use relative module paths

Source plugins:

- Compatibility-language parsing, lowering, and source import scanning belong in plugin crates.
- `pd-vm` exposes `SourcePlugin`, `FrontendIr`, parser dialect helpers, and IR builder types for plugin authors.
- `compile_source_file()` without options only handles built-in `.rss`; use `compile_source_file_with_options()` for plugin-backed extensions.

### JIT Internals

The VM has two native codegen paths:

- `AOT`: lowers the whole bytecode CFG into ahead-of-time native segments.
- `Trace JIT`: records hot loops, prefers SSA native lowering when the recorder can specialize the
  loop, and otherwise leaves the operation on a call/exit path or records NYI.

Trace JIT remains LuaJIT-style hot-loop tracing:

- hot bytecode loop heads are detected
- a trace is recorded from each hot root
- backward `brfalse` can loop inside the trace when it targets an earlier recorded step
- native machine code is emitted per compiled trace and invoked by the VM
- unsupported opcodes or trace shapes fall back to interpreter and are recorded as NYI

Status legend:

- `Inline`: dedicated native lowering, no runtime helper/bridge on the fast path.
- `Helper`: compiled native code calls a narrow native helper but stays in compiled execution.
- `Bridge/Exit`: no dedicated lowering for that backend; execution stays on the normal runtime call path or exits the trace around that operation.
- `NYI`: not currently lowered by that backend.

The table below tracks lowering state once typed lowering/specialization is available. For trace JIT,
frontend/source patterns may still reach a `Bridge/Exit` path even when an SSA inline form exists.

| Operator family | AOT | Trace JIT |
| --- | --- | --- |
| Typed numeric `+`, `-`, `*`, `/`, `%`, unary `-` | Inline | Inline |
| Typed numeric `==`, `<`, `>` | Inline | Inline |
| `<<` | Inline | Inline |
| `>>`, `>>>` | Inline | Inline |
| Eager `and`, `or`, `not` opcodes | Inline | Inline |
| Short-circuit `&&`, `\|\|` source forms | Lowered as branches, then compiled | Lowered as branches, then traced/compiled |

| Builtin / container op | AOT | Trace JIT |
| --- | --- | --- |
| String concat / bytes concat | Inline | Inline |
| `len(string)`, `len(bytes)` | Inline | Inline |
| `get(string)`, `get(bytes)` | Inline | Inline |
| `slice(string)`, `slice(bytes)` | Inline | Inline |
| `has(bytes)` | Inline | Inline |
| `bytes::from_array_u8`, `bytes::to_array_u8` | Inline | Inline |
| `len(array)` | Bridge/Exit | Inline |
| `get(array)` | Bridge/Exit | Inline for scalar elements, Helper for heap elements |
| `has(array)` | Bridge/Exit | Inline |
| `len(map)` | Bridge/Exit | Inline |
| `get(map)` | Bridge/Exit | Helper |
| `has(map)` | Bridge/Exit | Helper |
| `string_contains`, `string_replace_literal`, `string_lower_ascii`, `string_split_literal` | Bridge/Exit | Helper |
| `re::match`, `re::replace` | Bridge/Exit | Helper |
| Dynamic `type`, `to_string`, equality, and `len` | Bridge/Exit | Helper (known `type` / string `to_string` cases are folded) |
| All other builtins | Bridge/Exit | Bridge/Exit or NYI, depending on trace shape |
| Host imports | Bridge/Exit | Bridge/Exit or branch-exit trace, never inline |

Current trace-JIT-wide NYI:

- traces longer than configured max trace length
- unsupported opcodes or unsupported trace shapes during recording/lowering
- unsupported native targets outside `x86_64` Windows / Unix-non-macOS and `aarch64` Linux / macOS
