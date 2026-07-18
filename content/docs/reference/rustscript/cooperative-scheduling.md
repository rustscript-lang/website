<!-- docs-title: Cooperative Scheduling -->

RustScript supports cooperative execution slices through fuel metering and epoch interruption. Both mechanisms pause only at coherent VM boundaries and resume through `run()` or `resume()`.

## Choosing fuel or epoch

| Mechanism | Best fit | Trigger |
|---|---|---|
| Fuel | Deterministic instruction budgets and per-task quotas | The configured fuel budget reaches zero. |
| Epoch | Externally advanced scheduler ticks | The shared epoch reaches the armed deadline. |

Fuel metering and epoch interruption are mutually exclusive. Enabling one disables or rejects the other API surface, depending on the operation.

## Fuel metering

Fuel controls are available on both `Vm` and `Store<T>`:

- `set_fuel`
- `clear_fuel`
- `set_fuel_check_interval`
- `fuel_check_interval`
- `get_fuel`
- `consume_fuel`
- `consume_fuel_tick`
- `add_fuel` / `recharge_fuel` (`Store::recharge`)
- `fuel_checkpoint` / `checkpoint`
- `restore_fuel` / `restore_checkpoint`

Fuel metering is disabled by default. `set_fuel` installs an explicit budget; `add_fuel` also enables metering when it was disabled.

```rust
use vm::{Store, VmStatus};

// Construct the VM from a compiled Program, then wrap it with host context.
let mut store = Store::from_vm(vm);
store.set_fuel(10_000);
store.set_fuel_check_interval(1)?;
let checkpoint = store.checkpoint();

loop {
    match store.run()? {
        VmStatus::Halted => break,
        VmStatus::Yielded => {
            store.recharge(1_000)?;
        }
        VmStatus::Waiting(_) => {
            store.vm_mut().wait_for_host_op_blocking()?;
        }
    }
}

store.restore_checkpoint(checkpoint);
```

### Charging cadence

The interpreter checks fuel before opcode fetch and execution. Trace-JIT and native JIT execution apply the same configured cadence to trace operations or generated code.

- The default interval is `1`, which provides exact checks.
- With an interval greater than `1`, detection is coarse-grained and may occur up to `interval - 1` instructions after the budget crosses the next checkpoint.
- An out-of-fuel event returns `VmStatus::Yielded` before the next instruction runs. The instruction pointer is unchanged.
- Host-side work is not automatically charged beyond VM instruction execution. Host code can call `consume_fuel` for an additional policy.

`FuelCheckpoint` stores only accounting state: remaining fuel, check interval, and check-phase cursor. Restoring it does not rewind the VM stack, locals, or instruction pointer.

## Epoch interruption

Epoch APIs are available on `Vm` and forwarded by `Store<T>`:

- `epoch_handle`
- `current_epoch`
- `increment_epoch` / `increment_epoch_by`
- `set_epoch_deadline`
- `clear_epoch_deadline`
- `epoch_deadline` / `epoch_deadline_delta`
- `set_epoch_check_interval`
- `epoch_check_interval`
- `consume_epoch_tick`
- `epoch_checkpoint` / `restore_epoch`
- `last_yield_reason`

`EpochHandle` is shared engine-style state. The epoch is an abstract counter; it has no wall-clock meaning until the embedding scheduler advances it.

```rust
let epoch = store.epoch_handle();
store.set_epoch_deadline(10)?;
store.set_epoch_check_interval(1)?;

// A scheduler thread or event loop advances the shared counter.
epoch.increment_by(10);

match store.run()? {
    VmStatus::Yielded => assert_eq!(store.vm().last_yield_reason(), Some(VmYieldReason::Epoch)),
    status => panic!("expected epoch yield, got {status:?}"),
}
```

`set_epoch_deadline(n)` arms a yield at `current_epoch_at_arm + n`. After an epoch yield, the next `run()` or `resume()` automatically re-arms the same relative deadline. Clear the deadline to disable interruption.

## CLI controls

Run with a fuel slice:

```powershell
pd-vm-run --fuel 100000 examples/example.rss
```

Run with an epoch deadline and explicit checkpoint cadence:

```powershell
pd-vm-run --epoch-deadline 10 --epoch-check-interval 1 examples/example.rss
```

## Yield reasons and resume rules

`VmStatus::Yielded` is shared by cooperative and host-driven yields. Inspect `last_yield_reason()` when the scheduler must distinguish them.

- Fuel and epoch checks happen before the next opcode begins. The instruction pointer still targets the unconsumed opcode.
- `CallOutcome::Yield` is host-driven: the VM restores the original arguments and rewinds to the `call` opcode so the host function can be retried.
- `CallOutcome::Pending(op_id)` advances past the call and enters `VmStatus::Waiting(op_id)` until the operation completes.
- The fused `call; ret` tail pattern consumes the trailing return inline. A cooperative check after the completed call may yield with return values already on the stack and the instruction pointer past `ret`.

No suspension leaves a partially executed instruction in flight. Embedders can schedule VMs by replenishing fuel, advancing epochs, or completing host operations, then calling `run()` or `resume()` again.
