<!-- docs-title: VM API -->

The `pd-vm` crate exposes the Rust API for constructing, running, suspending, resuming, and reusing a RustScript virtual machine.

## API Reference

### Construction and program ownership

Use these constructors according to the ownership and native-code configuration required by the embedding runtime:

- `Vm::new(program)` constructs a VM with the default `JitConfig`.
- `Vm::new_with_jit_config(program, config)` installs an explicit JIT configuration.
- `Vm::new_shared(Arc<Program>)` shares an immutable program.
- `Vm::new_shared_with_jit_config(Arc<Program>, config)` combines shared ownership with explicit JIT configuration.
- `program()` returns the active `Program`.

A `Program` owns its callable prototypes. `Store::replace_vm` invalidates callbacks registered against the previous VM before installing the replacement.

```rust
use std::error::Error;
use vm::{compile_source, Value, Vm, VmStatus};

fn main() -> Result<(), Box<dyn Error>> {
    let compiled = compile_source("let value = 40 + 2; value;")?;
    let mut vm = Vm::new(compiled.program.with_local_count(compiled.locals));

    match vm.run()? {
        VmStatus::Halted => assert_eq!(vm.stack().last(), Some(&Value::Int(42))),
        VmStatus::Yielded | VmStatus::Waiting(_) => {}
    }
    Ok(())
}
```

### Execution lifecycle

- `run()` executes from the current instruction pointer until halt, yield, or wait.
- `resume()` continues a suspended VM using the same execution state.
- `run_with_debugger(debugger)` executes through debugger hooks.
- `reset_for_reuse()` clears stack and locals, rewinds to the program entry, cancels waiting host work, and invalidates callback registrations.
- `stack()` and local/debug metadata expose state for diagnostics.
- `last_yield_reason()` distinguishes host, fuel, and epoch yields.

`VmStatus` has three scheduler-visible outcomes:

| Status | Meaning |
|---|---|
| `Halted` | The root continuation completed. |
| `Yielded` | Host logic, fuel, or epoch interruption paused execution. |
| `Waiting(op_id)` | An asynchronous host operation must complete before execution continues. |

### Store and host context

`Store<T>` wraps a `Vm` together with embedding data:

- `Store::new(vm, data)` and `Store::from_vm(vm)` construct a store.
- `vm()` / `vm_mut()` access the VM.
- `data()` / `data_mut()` access host context.
- `into_vm()` / `into_data()` consume the wrapper.
- `run()` / `resume()` forward execution.
- `reset_for_reuse()` resets the VM and installs a new callback registry.
- `replace_vm(vm)` invalidates callbacks from the previous program and installs the replacement.

### Script callback API

Exported RustScript functions can be resolved into typed callbacks:

- `resolve_exported_callable(name)` returns the exported callable value.
- `script_callback_by_name::<Args, Ret>(name)` resolves and validates a typed callback.
- `script_callback::<Args, Ret>(callable)` validates an existing callable value.
- `ScriptCallback::call(store, args)` invokes synchronously.
- `ScriptCallback::start(store, args)` starts execution and returns `VmStatus`.
- `ScriptCallback::prepare(args)` creates a queued invocation.
- `enqueue_callback`, `drain_callbacks`, and `take_callback_result` operate the callback queue.
- `unsubscribe()` invalidates one callback subscription.

Callback arguments implement `ScriptArgs` and `IntoScriptValue`; results implement `ScriptResult`. The store validates arity and callable schemas where metadata is available. A callback cannot be invoked through a different store or after its program registry was invalidated.

### Host operation lifecycle

Direct host calls can complete synchronously, yield for retry, or become pending:

| `CallOutcome` | Instruction pointer | Stack behavior |
|---|---|---|
| `Return(values)` | Advances past `call`. | Pushes returned values. |
| `Yield` | Rewinds to the `call` opcode. | Restores original arguments for retry. |
| `Pending(op_id)` | Advances past `call`. | Waits for completion values. |

Relevant VM methods include:

- `allocate_host_op_id()`
- `waiting_host_op_id()`
- `complete_host_op(op_id, values)`
- `poll_waiting_host_op(cx)`
- `await_waiting_host_op()`
- `wait_for_host_op_blocking()`
- `set_async_bridge(...)` / `clear_async_bridge()`

A host function returning `CallOutcome::Yield` must be safe to invoke again because the entire call is retried. `Pending` operations resume after `complete_host_op` pushes their result values.

### Cooperative scheduling APIs

`Vm` and `Store<T>` expose fuel and epoch controls. The main groups are:

- Fuel budgets, recharge, explicit consumption, check intervals, and checkpoints.
- Shared `EpochHandle`, relative deadlines, check intervals, and epoch checkpoints.
- `last_yield_reason()` for scheduler decisions.

See [Cooperative Scheduling](../cooperative-scheduling/) for the full method list and execution rules.

### Runtime limits and caches

Script call frames default to a limit of 1,024. Use:

- `max_script_call_depth()`
- `set_max_script_call_depth(limit)`

A zero limit is rejected. Exceeding the limit returns `VmError::CallStackOverflow`.

Each VM also owns an LRU cache for compiled regular expressions used by `re::match`, `re::find`, `re::replace`, `re::split`, and `re::captures`:

```rust
let mut vm = Vm::new(program);
assert_eq!(vm.regex_cache_capacity(), 512);
vm.set_regex_cache_capacity(128);

// Zero clears entries and disables the cache.
vm.set_regex_cache_capacity(0);
```

Inspect cache state with `regex_cache_entry_count()`, `regex_cache_compile_count()`, and `regex_cache_hit_count()`.

### Runtime output and diagnostics

- `set_runtime_print_sink(...)` / `clear_runtime_print_sink()` route `print` and `println` output.
- `interpreter_metrics_snapshot()` and `clear_interpreter_metrics()` expose interpreter counters.
- `set_jit_native_bridge_stats_enabled`, `jit_native_bridge_stats_snapshot`, and `clear_jit_native_bridge_stats` expose bridge diagnostics.
- JIT and AOT methods are grouped in [JIT and AOT](../jit-aot/).

### `no_std` VM

`pd-vm-nostd::Vm` provides a smaller VMBC-based API for embedded targets. It supports `Vm::new`, direct `run()`, synchronous host callbacks, script call-depth controls, and instruction fuel without the source compiler, debugger, native backends, or asynchronous host bridge.
