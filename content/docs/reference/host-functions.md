# Host functions

A host function is supplied by the embedding runtime. RSS imports a namespace and calls the registered members; the host controls which capabilities exist.

## Namespace boundary

```rss
use runtime;
let sleep_ok = runtime::sleep(100);
```

## Registration contract

The host declares the namespace, function name, argument schema, return schema, and execution behavior. RSS compilation records imports and validates syntax; the runtime binds and invokes the actual capability.

A `#[pd_host_function]` declaration is the source of one function's guest schema, runtime binding, typed resource requirements, named-struct contract, and hidden host-state effects. The generated `HostFunctionDescriptor` bundles those parts. An ordered `HostModuleDescriptor` lists the functions explicitly; `install` derives the guest catalog from that list and registers adapters transactionally. There is no linker inventory.

The following rules keep a script portable:

- Import only documented namespaces.
- Treat host-specific argument and return types as runtime API contracts.
- Keep privileged I/O, network, model, hardware, and UI work inside explicit host calls.
- Use the runtime-specific documentation for lifecycle and asynchronous behavior.

## Descriptors and module composition

One host function declaration produces, in a single macro expansion:

| Part | Meaning |
|---|---|
| `schema` | The guest ABI: parameter names, types, passing modes, and return type. Guest schemas and resource declarations feed the catalog fingerprint. |
| `binding` | The dispatch class (`Static`, `StaticStack`, `StaticStackRuntimeOwned`, `StaticArgs`, `StaticNonYieldingArgs`, `Owned`). |
| `adapter` | The concrete adapter or owned-dispatch factory installed into a registry. |
| `effects` | Guest resource effects and hidden host-state read/write effects. Runtime-only metadata; excluded from the fingerprint. |
| `resource_types` | The concrete resource-type declarations this function contributes. |

A `HostModuleDescriptor` aggregates functions in a deterministic, author-declared order:

```rust
use vm::HostModuleDescriptor;

pub fn demo_module() -> HostModuleDescriptor {
    HostModuleDescriptor {
        name: "demo",
        functions: &[
            make_counter_descriptor,
            read_counter_descriptor,
        ],
        resources: &[],
    }
}
```

Install through `HostExtension`:

```rust
impl vm::HostExtension for DemoExtension {
    fn register(&self, registry: &mut vm::HostFunctionRegistry) -> VmResult<()> {
        demo_module().install(registry).map(|_| ())
    }

    fn install(&self, vm: &mut vm::Vm) {
        demo_module()
            .install_state_requirements(vm)
            .expect("descriptor state requirements install");
    }
}
```

Installation is transactional and fail-closed. Function schemas, resource declarations, named-struct bodies, binding/adapter agreement, and hidden host-state requirements are validated first. A later failure rolls back every adapter the call installed. Conflicting resource keys or state providers fail before the registry changes.

`install_from_catalog(registry, catalog)` is the descriptor path when the embedder supplies its own catalog snapshot. Every descriptor must match exactly one import in that snapshot. Each installed import is granted the host-import capability it needs, so a restricted registry (`HostFunctionRegistry::restricted`) keeps its deny-by-default policy for every import the module does not declare.

## Typed resource effects

Typed wrappers carry the guest resource effect. Implement `HostResourceType` once per concrete type.

| Wrapper | Effect |
|---|---|
| `ResourceRef<'_, T>` | `Borrow<T>` |
| `ResourceMut<'_, T>` | `BorrowMut<T>` |
| `ResourceOwned<T>` | `TakeOwned<T>` |
| `Resource<T>` return | `Create<T>` |

```rust
use pd_host_function::pd_host_function;
use vm::{HostResourceType, Resource, ResourceOwned, ResourceRef, Vm, VmError, VmResult, resource};

pub struct Counter(u64);

impl resource::HostResource for Counter {}

impl HostResourceType for Counter {
    const KEY: &'static str = "demo.counter";
    const DESCRIPTION: &'static str = "A monotonic counter";
}

/// Creates a counter and returns its handle.
#[pd_host_function(name = "demo::make_counter")]
pub fn make_counter(vm: &mut Vm, seed: i64) -> VmResult<Resource<Counter>> {
    vm.host_context()
        .push_resource(Counter(seed as u64))
        .map_err(|error| VmError::HostError(error.to_string()))
}

/// Reads the current count.
#[pd_host_function(name = "demo::read_counter")]
pub fn read_counter(counter: ResourceRef<'_, Counter>) -> VmResult<i64> {
    Ok(counter.get().0 as i64)
}

/// Consumes the counter.
#[pd_host_function(name = "demo::close_counter")]
pub fn close_counter(counter: ResourceOwned<Counter>) -> VmResult<bool> {
    let _ = counter.into_inner();
    Ok(true)
}
```

The guest parameter and return schemas, plus the resource declarations, come from those wrappers. Identical `HostResourceType` declarations dedupe. The same key claimed by a different Rust type fails before any registry mutation. A synchronous function cannot take both `&mut Vm` and a `ResourceRef` or `ResourceMut` parameter; use `ResourceOwned`, or split the work into two calls. Every declaration needs a doc comment.

## Hidden host state

Per-VM dependencies that guests must never see are hidden parameters. They do not count toward guest arity, never appear in the schema, catalog fingerprint, or VMBC, and are resolved through the generic host-state table. `HostStateLifetime` is VM-only: the instance survives `Vm::reset_for_reuse` and execution-scope close, stays isolated between VMs, and drops with the VM.

`HostStateRef<T>` is a shared borrow guard and produces a read effect. `HostStateMut<T>` is an exclusive borrow guard and produces a write effect. The wrappers do not carry a lifecycle or initializer. State is created lazily by `HostState::initialize()` on first use unless the embedder preconfigures it with `HostContext::set_host_state` before first use. Hidden state cannot be combined with resource parameters in one function, and cannot cross an async boundary.

The regex host module stores `RegexCache` this way. Interpreter `re::*` functions take `HostStateMut<RegexCache>` instead of `&mut Vm`. Configuration and statistics are `RegexCacheVmExt` methods on `Vm`; see [VM API](/docs/reference/rustscript/vm-api/).

## Named structs

Rust signatures cannot spell field names. For a fixed-shape public host value, implement `HostNamedStruct` and mark the declaration:

```rust
pub struct JitConfig;

impl vm::HostNamedStruct for JitConfig {
    const NAME: &'static str = "JitConfig";
    fn host_struct_fields() -> Vec<vm::HostStructField> {
        vec![vm::HostStructField::new("enabled", vm::HostTypeSchema::Bool)]
    }
}

#[pd_host_function(name = "jit::get_config")]
#[pd_host_named_struct]
pub fn get_config(vm: &mut Vm) -> VmResult<JitConfig> {
    let _ = vm;
    Ok(JitConfig)
}
```

The generated descriptor emits the full `Named { name, fields }` schema, and the module catalog derives the named struct from it. Do not model public host request, result, or event values as `Map(unknown)` or `unknown`.

## Runtime-specific namespaces

| Runtime | Example namespaces |
|---|---|
| Core RustScript | `bytes`, `re`, `json`, `runtime` |
| pd-edge | `http`, `proxy`, transport and protocol namespaces |
| micro-rustscript | `gpio`, `i2c`, `mcu`, `serial`, `wifi`, `bluetooth` |
| IronRust | typed `System::...` imports |
| Flint | `flint::cli`, `flint::runtime`, `flint::llama`, `flint::tensor` and related namespaces |

## Host functions as callable values

A host function referenced without immediate invocation becomes a callable value when its schema is known. It can be passed, returned, selected, or stored, then invoked through the same `callvalue` path as a named script function or closure. Direct host calls continue to use the bound `call` path.

```rss
fn host_transform(value: int) -> int;
let transform: fn(int) -> int = host_transform;
transform(41);
```

## Script callbacks exposed to the host

Exported script functions and existing callable values can cross the embedding boundary as typed `ScriptCallback` handles. The host may invoke a callback synchronously, start it and drive its `VmStatus`, or enqueue a prepared invocation for serialized execution. Arity and schemas are validated where metadata is available. Callback handles are bound to one store and program generation; reset or program replacement invalidates registrations from the previous generation.

See [VM API](/docs/reference/rustscript/vm-api/#script-callback-api) for callback resolution, invocation, queueing, and invalidation methods.

## Generated `#[pd_host_function]` binding selection

Default host functions declared with `#[pd_host_function]` select a generated binding from their Rust signature. That binding is part of the `HostFunctionDescriptor`; module installation preserves it.

| Signature shape | Generated binding | JIT behavior |
|---|---|---|
| Has a `Vm` parameter | `StaticStack` | VM-aware call boundary. |
| Returns `CallOutcome`, `VmResult<CallOutcome>`, or `HostResult<CallOutcome>` | `StaticArgs` | General boundary that may halt, yield, or become pending. |
| Args-only with a supported ordinary return such as `Value`, `bool`, `String`, `Option<T>`, `VmResult<T>`, or `HostResult<T>` | `StaticNonYieldingArgs` | Eligible to stay inside a native loop trace. |
| Unrecognized return shape | `StaticArgs` | Conservative general boundary. |

For a synchronous host function that always returns one value, prefer an ordinary return type, `VmResult<T>`, or `HostResult<T>`. This communicates a non-yielding contract and can keep an eligible host call inside a native trace. Use `CallOutcome` when the function needs `Halt`, `Yield`, `Pending`, or explicit control over the number of returned values.

```rust
#[pd_host_function(name = "runtime::is_ready")]
fn runtime_is_ready() -> VmResult<bool> {
    Ok(true)
}
```

This signature selects `StaticNonYieldingArgs`. Changing the return type to `VmResult<CallOutcome>` selects `StaticArgs` because the signature no longer proves a synchronous one-value result.

## Non-yielding static host calls

A `StaticNonYieldingArgs` binding lets the Trace JIT retain eligible calls inside a native trace.

The function must return exactly one value through `CallOutcome::Return(CallReturn::One(...))`. Returning no value, `Halt`, `Yield`, or `Pending` violates the contract and produces `VmError::HostError` in interpreted and native execution. Use a general static-args binding whenever a host function may suspend, halt, or return no value.

## Compatibility window

These APIs remain public and supported:

- `HostApiBuilder::{resource, named_struct, function}`
- `HostFunctionRegistry::register`, `register_static`, `register_stack`, `register_static_stack`, `register_args`, `register_static_args`, `register_static_non_yielding_args`, and the catalog/exact-family registrations, including `register_exact_owned`
- `Vm::bind_static_non_yielding_args_function` and `Vm::register_static_non_yielding_args_function`
- The per-module `register_*_builtin_module{,_from_catalog}` entry points

Prefer `HostModuleDescriptor` with `install` / `install_from_catalog`, `HostFunctionDescriptor`, `HostResourceType`, and `HostOwnedAdapterFactory` for new modules. Catalogs built with `HostApiBuilder` compose with descriptor modules through `install_from_catalog`.

## Host suspension outcomes

- `CallOutcome::Yield` restores arguments and retries the entire `call` on the next `run()` or `resume()`; the host function must be idempotent across retries.
- `CallOutcome::Pending(op_id)` advances beyond `call` and returns `VmStatus::Waiting(op_id)` until the host completes the operation.
- `CallOutcome::Return(values)` advances beyond `call` and pushes the returned values.

See [VM API](/docs/reference/rustscript/vm-api/) for host-operation completion and polling methods.
