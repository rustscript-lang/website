<!-- docs-title: Bytecode -->

RustScript compiles source into a `Program` containing compact stack-machine bytecode. The interpreter, debugger, trace recorder, AOT compiler, and VMBC serializer share this representation.

## Program layout

A `Program` carries the executable and its runtime metadata:

- `constants: Vec<Value>`
- `code: Vec<u8>`
- `local_count: usize`
- `imports: Vec<HostImport>`
- `debug: Option<DebugInfo>`
- `type_map: Option<TypeMap>`
- script-function, callable-prototype, function-region, and root-binding tables

`Program` owns callable prototypes and exported-callable metadata. `Store` owns callback registrations and invalidates them on reset, VM replacement, shutdown, or unsubscribe.

## TypeMap

`TypeMap` records typed lowering information used by the interpreter and native backends:

- `operand_types: HashMap<usize, (ValueType, ValueType)>`
- `local_types: Vec<ValueType>`

`operand_types` is keyed by bytecode offset and records inferred operand pairs for binary operations and comparisons. `local_types` is a post-lowering local-slot summary. Compiler-inserted `null` clears and hidden frame slots can widen entries to `Unknown` or `Null`, so it is not a source-level binding table.

## Instruction encoding

Each instruction begins with one byte containing an `OpCode`. Operands follow in little-endian form as `u8`, `u16`, or `u32` values. Branch operands contain absolute bytecode targets.

Core stack and control opcodes include:

| Opcode | Mnemonic | Operands | Stack or control effect |
|---|---|---|---|
| `0x00` | `nop` | — | No change. |
| `0x01` | `ret` | — | Return from the active continuation or halt the root. |
| `0x02` | `ldc` | `u32 index` | Push a constant. |
| `0x03` | `add` | — | `(a, b) → a + b`. |
| `0x04` | `sub` | — | `(a, b) → a - b`. |
| `0x05` | `mul` | — | `(a, b) → a * b`. |
| `0x06` | `div` | — | `(a, b) → a / b`. |
| `0x07` | `neg` | — | `a → -a`. |
| `0x08` | `ceq` | — | `(a, b) → a == b`. |
| `0x09` | `clt` | — | `(a, b) → a < b`. |
| `0x0A` | `cgt` | — | `(a, b) → a > b`. |
| `0x0B` | `br` | `u32 target` | Set the instruction pointer to `target`. |
| `0x0C` | `brfalse` | `u32 target` | Pop a boolean and branch when false. |
| `0x0D` | `pop` | — | Discard the top value. |
| `0x0E` | `dup` | — | Duplicate the top value. |
| `0x0F` | `ldloc` | `u8 index` | Push a local. |
| `0x10` | `stloc` | `u8 index` | Pop into a local. |
| `0x11` | `call` | `u16 id, u8 argc` | Dispatch a builtin or direct host import. |
| `0x12` | `shl` | — | Shift left. |
| `0x13` | `shr` | — | Shift right. |
| `0x14` | `mod` | — | Remainder. |
| `0x15` | `and` | — | Eager logical and. |
| `0x16` | `or` | — | Eager logical or. |

The current `OpCode` enum also covers collection operations, callable values, frame management, borrows, and compiler-generated lifetime operations. Treat the Rust enum and VMBC decoder as authoritative for the complete set.

## Calls and continuations

Direct `call` dispatch remains separate from callable-value dispatch:

1. Builtins use fixed reserved indices from `BuiltinFunction::call_index()`.
2. Runtime host imports are remapped to dense per-program import slots and emitted as `call <slot>, <argc>`.
3. Host functions used as values, RustScript function items, and closures execute through `callvalue <argc>`.

`callvalue` validates the callable prototype, schema, arity, and frame layout before entering a script body or host callable. `ret` completes the active typed continuation: root halt, caller resume, or host return.

## VMBC wire format

VMBC v9 serializes the `Program` needed by another runtime. It carries constants, bytecode, imports, debug/source information when included, type metadata, script functions, callable prototypes, function regions, and root bindings.

Use the released runner to emit and inspect artifacts:

```powershell
pd-vm-run --emit-vmbc out/example.vmbc examples/example.rss
pd-vm-run --disasm-vmbc out/example.vmbc
pd-vm-run --disasm-vmbc out/example.vmbc --show-source
```

## Assembler API

`assemble()` parses textual assembly into a `Program`. `Assembler` and `BytecodeBuilder` provide lower-level construction APIs.

Data declarations:

- `const NAME VALUE`
- `string NAME "..."`

Directives:

- `.data` and `.code` switch sections.
- `.label NAME` defines a jump label.
- `.local NAME [INDEX]` defines a named local.

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

## Embedded VMBC runtime

The `pd-vm-nostd` crate decodes VMBC v9 and executes it using only `core` and `alloc`. It supports direct bytecode execution, script frames and callable values, synchronous host callbacks, and instruction fuel. Source compilation, debugger transports, JIT/AOT, asynchronous host operations, and operating-system integration remain in `pd-vm`.

Compile `.rss` to VMBC on a host, then load that artifact through `pd_vm_nostd` on the target. The PlatformIO Arduino-Pico integration is maintained in [micro-rustscript](https://github.com/rustscript-lang/micro-rustscript).
