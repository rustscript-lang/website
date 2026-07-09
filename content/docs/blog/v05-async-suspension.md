# Async Suspension Without Coroutines

*How pd-vm yields to the host for I/O, and how fuel and epoch interrupts keep scripts under control*

---

## The Problem: I/O in a Single-Threaded VM

pd-vm runs inside a proxy runtime on top of Tokio. Scripts need to trigger I/O, but the VM itself is a synchronous bytecode machine. It does not expose script-level coroutines, green threads, or language-native `async`.

The design answer is explicit suspension at host-call boundaries.

## The Four Outcomes

Every host call resolves to one of four outcomes:

```rust
enum CallOutcome {
    Return(Vec<Value>),
    Halt,
    Yield,
    Pending(HostOpId),
}
```

### Return

The call completed synchronously and the interpreter continues.

### Halt

The host requests termination and the VM stops.

### Yield

The host asks the VM to retry the same call later. The VM rewinds to that call boundary and returns `VmStatus::Yielded`.

### Pending

The host has started an asynchronous operation and returns a `HostOpId`. The VM records that waiting state, advances past the call, and returns `VmStatus::Waiting`.

## How pd-edge Integrates This With Tokio

The async integration is direct because the VM already exposes a host-operation polling boundary:

```rust
loop {
    match vm.run()? {
        VmStatus::Halted => break,
        VmStatus::Yielded => {
            match vm.last_yield_reason() {
                Some(VmYieldReason::Fuel) => {
                    /* recharge fuel if needed */
                }
                Some(VmYieldReason::Epoch) => {
                    /* re-arm deadline */
                }
                Some(VmYieldReason::Host) | None => {
                    /* cooperative reschedule */
                }
            }
        }
        VmStatus::Waiting(_) => {
            vm.await_waiting_host_op().await?;
        }
    }
}
```

`await_waiting_host_op()` is an ordinary async boundary. Tokio suspends the task while the host operation is still pending and wakes it when the bridge reports completion.

## Why Not Coroutines?

Coroutines would allow suspension from more places, but they would also require a different runtime shape:

- separate coroutine stacks or equivalent state machines
- more complicated resume mechanics
- tighter compiler coupling to yield-capable control flow

pd-vm keeps suspension narrower on purpose. The continuation is just VM state the runtime already owns: instruction pointer, operand stack, locals, and optional pending host-op bookkeeping.

That choice keeps the embedding surface simpler and makes pause, resume, pooling, and debugging more direct.

## Fuel: Instruction-Level Budgeting

Fuel limits compute by counting execution progress inside the VM:

```rust
vm.set_fuel(10_000);
vm.set_fuel_check_interval(256);
```

When fuel is exhausted, the VM yields with `VmYieldReason::Fuel`. The host can then refill, terminate, or log the script.

Fuel is per VM. That matters because it bounds the work of one request independently of others.

## Epoch: Wall-Clock Deadlines

Epoch is the wall-clock side of interruption. The host advances a shared epoch counter from outside the VM, and each VM carries its own deadline:

```rust
vm.set_epoch_deadline(5)?;
vm.set_epoch_check_interval(512)?;
```

When the current epoch passes the deadline, the VM yields with `VmYieldReason::Epoch`.

This gives the runtime time-based interruption without putting clocks or timers inside the VM itself.

## Fuel vs Epoch

| | Fuel | Epoch |
|---|---|---|
| **Tracks** | VM compute work | Host-defined time slices |
| **Source** | Budget stored on the VM | Shared counter advanced by the host |
| **Use case** | CPU budget enforcement | Request timeout enforcement |
| **Scope** | Per VM | Shared time source, per-VM deadlines |

In practice, `pd-edge` uses both: fuel limits how much work one script can do, while epoch limits how long it may hold onto the request timeline.

## Instruction-Boundary Atomicity

Fuel and epoch checks happen at instruction boundaries. Host-call suspension happens at call boundaries. That means the VM never resumes from a half-executed opcode.

This is the key safety property of the design. Suspension is explicit and structurally aligned with the VM's own execution model.

## Where This Falls Short

- **The VM tracks one pending host operation at a time.** Script-level fan-out must be expressed through host functions rather than through multiple concurrent pending operations inside the VM.
- **`Yield` requires idempotent host behavior.** Retrying the same host call is only correct when the host side can safely replay it.
- **There is no script-level concurrency model.** Concurrency lives in the host runtime, not in the scripting language.
- **Budget checks are amortized, not exact per instruction.** That is correct for control and fairness, but it is not a precision accounting model.

## Summary

pd-vm does not need coroutines to integrate with async I/O. It uses a narrower and more operationally direct mechanism: suspend at host-call boundaries, surface waiting through the VM state machine, and let the embedding runtime drive completion through normal async polling.

## Related

- [Why pd-vm Uses a Stack + Local-Slots Architecture](./v01-why-stack-and-local-slots.md)
- [The Protocol DAG](./e01-protocol-dag-and-session-reuse.md)
- [Host Function ABI](./v06-host-function-abi.md)
