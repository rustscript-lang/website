<!-- docs-title: Compiler -->

The RustScript compiler lowers `.rss` source and plugin-provided compatibility frontends into frontend-independent IR, validates and legalizes that IR, then emits a `Program` for the VM.

## Pipeline layers

The complete source-file path is divided into these layers:

1. Module and source loading through `compile_source_file()`.
2. Unit linking through `linker::merge_units`.
3. Frontend lowering through the built-in RustScript frontend or a registered source plugin.
4. Frontend-independent IR.
5. Type-consistency validation on legalized IR.
6. Lifetime and liveness lowering plus type-metadata collection.
7. Bytecode lowering through `Compiler` and `Assembler` into `Program`.
8. Optional trace-JIT SSA recording and native lowering at runtime.

`compile_source()` starts from an in-memory RustScript unit and therefore skips source-file module loading and linking.

## Frontend-independent IR

Frontends produce shared IR instead of emitting VM bytecode directly. The shared layer represents values, locals, blocks, branches, calls, closures, borrows, collections, and source spans independently of JavaScript, Lua, or RustScript syntax.

The plugin surface includes:

- `SourcePlugin`
- `FrontendIr`
- parser dialect helpers
- IR builder types
- source import scanning and stripping hooks

Compatibility-language parsing, syntax, and import conventions remain inside plugin crates. The core compiler owns legalization, validation, lowering, metadata, and bytecode emission.

## Type inference and metadata

The compiler performs pragmatic value-type inference before bytecode emission and records available results in `Program.type_map`.

Important behaviors include:

- `int` arithmetic stays `int`.
- Mixed numeric arithmetic widens to `float`.
- `+` becomes string concatenation when either operand is known to be a string.
- Callable return types propagate through named calls, function-valued locals, closures, and callable parameters when the callee remains identifiable.
- Known incompatible `if`/`else` results and branch-local merges are compile errors.
- Optional values retain their inner type after `unwrap_or`, a non-null refinement, or a `Some(name)` match arm.

This metadata drives diagnostics and monomorphic runtime paths. It is intentionally smaller than a complete source-language static type system.

## Lifetime and liveness lowering

After type validation, lowering assigns local slots and inserts the operations required by RustScript move and borrow semantics. Compiler-generated `null` clears and hidden frame slots are implementation details of this phase.

The lowering pass also prepares:

- function regions and typed continuations
- callable prototypes and root bindings
- closure captures
- local lifetime boundaries
- bytecode-offset operand metadata
- source/debug mappings

Move-mode captures follow expression semantics: a bare local may move, `.copy()` copies, and `&value` or `&mut value` captures a borrowed view.

## Compiler APIs

Use `compile_source()` for in-memory RustScript source:

```rust
use vm::compile_source;

let compiled = compile_source("let value = 2 + 3; value * 4;")?;
```

Use `compile_source_file()` for built-in `.rss` file loading. Compatibility frontends use explicit options:

```rust
let options = CompileSourceFileOptions::new()
    .with_source_plugin(plugin);
let compiled = compile_source_file_with_options(path, options)?;
```

The source-file APIs preserve module, import, and source-map context. Built-in `.rss` loading accepts relative module paths; `crate::...` paths are not supported.

## Call lowering

The compiler keeps three call families distinct:

1. Builtins use fixed reserved indices.
2. Direct host imports use dense per-program slots and the `call` opcode.
3. Script functions, closures, and host functions used as values use callable prototypes and `callvalue`.

Every script function body is emitted once in a function region. Named functions and closure evaluation create callable values; invocation creates a real execution frame. `ret` completes the active root, script, or host continuation.

Host imports must be explicit in RSS, for example `use runtime;` or `use http;`. Builtin namespaces such as `io`, `re`, `json`, and `jit` use their builtin call indices.

## Current compiler limitations

### Core IR and callable values

- Callable locals can be passed, returned, called, and stored in arrays or maps.
- Callable values cannot be map keys or serialized as constants.
- Callable inference propagates only while a compatible signature remains identifiable.
- Function declarations may be nested and implicitly capture outer locals.
- Direct and mutual recursion are supported within the configured script frame limit.

### Types and control flow

- RustScript uses explicit nullable schemas such as `int?` and `Profile?`; non-optional declared locals and returns reject `null`.
- Optional chaining requires a user-declared container schema.
- `match` patterns currently cover int/string/null literals, `None`, `Some(name)`, `_`, and supported type constructors.
- `break` and `continue` are valid only inside loops.

### Modules and plugins

- Built-in `compile_source_file()` handles `.rss` without plugin options.
- Plugin-backed extensions use `compile_source_file_with_options()`.
- Compatibility frontends own their parsing, lowering, and import scanning.
- Runtime host namespaces are available only when the embedding runtime binds them.

## Bytecode backend

`Compiler` and `Assembler` turn legalized IR into compact bytecode and `Program` metadata. See [Bytecode](../bytecode/) for encoding, opcodes, the assembler API, and VMBC.

## Verification commands

Compiler and example characterization remains in the RustScript repository:

```powershell
cargo test -p pd-vm --test example_tests
```

Compiler-only wasm checking uses the no-default-feature build of `pd-vm`; browser diagnostics are exposed through `pd-vm-wasm::lint_source_json` as described in [Playground](../playground/).
