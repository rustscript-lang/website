# Host functions

A host function is supplied by the embedding runtime. RSS imports a namespace and calls the registered members; the host controls which capabilities exist.

## Namespace boundary

```rss
use runtime;
let sleep_ok = runtime::sleep(100);
```

## Registration contract

The host declares the namespace, function name, argument schema, return schema, and execution behavior. RSS compilation records imports and validates syntax; the runtime binds and invokes the actual capability.

The following rules keep a script portable:

- Import only documented namespaces.
- Treat host-specific argument and return types as runtime API contracts.
- Keep privileged I/O, network, model, hardware, and UI work inside explicit host calls.
- Use the runtime-specific documentation for lifecycle and asynchronous behavior.

## Runtime-specific namespaces

| Runtime | Example namespaces |
|---|---|
| Core RustScript | `bytes`, `re`, `json`, `runtime` |
| pd-edge | `http`, `proxy`, transport and protocol namespaces |
| micro-rustscript | `gpio`, `i2c`, `mcu`, `serial`, `wifi`, `bluetooth` |
| IronRust | typed `System::...` imports |
| Flint | `flint::cli`, `flint::runtime`, `flint::llama`, `flint::tensor` and related namespaces |

## Generated `#[pd_host_function]` binding selection

Default host functions declared with `#[pd_host_function]` select a generated binding from their Rust signature:

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

`Vm::bind_static_non_yielding_args_function` and `Vm::register_static_non_yielding_args_function` let the Trace JIT retain eligible calls inside a native trace.

The function must return exactly one value through `CallOutcome::Return(CallReturn::One(...))`. Returning no value, `Halt`, `Yield`, or `Pending` violates the contract and produces `VmError::HostError` in interpreted and native execution. Use the ordinary static-args APIs whenever a host function may suspend, halt, or return no value.

## Host suspension outcomes

- `CallOutcome::Yield` restores arguments and retries the entire `call` on the next `run()` or `resume()`; the host function must be idempotent across retries.
- `CallOutcome::Pending(op_id)` advances beyond `call` and returns `VmStatus::Waiting(op_id)` until the host completes the operation.
- `CallOutcome::Return(values)` advances beyond `call` and pushes the returned values.

See [VM API](/docs/reference/rustscript/vm-api/) for host-operation completion and polling methods.
