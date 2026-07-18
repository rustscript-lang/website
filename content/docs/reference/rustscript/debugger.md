<!-- docs-title: Debugger -->

## Start an interactive session

Run the stdio debugger with the `pd-vm-run` binary:

```powershell
pd-vm-run --debug examples/example.rss
```

The subcommand form is also accepted:

```powershell
pd-vm-run debug examples/example.rss
```

The debugger stops on entry by default. Use `--no-stop-on-entry` when execution should continue until a breakpoint or runtime event.

## TCP debugger

Listen for a debugger client on a TCP address:

```powershell
pd-vm-run --debug --tcp 127.0.0.1:9002 examples/example.rss
```

The TCP transport exposes the same VM control surface as the stdio debugger while leaving presentation to the remote client.

## Execution commands

| Command | Purpose |
|---|---|
| `break` | List breakpoints. |
| `break line` | Add a source-line breakpoint. |
| `step` | Execute one instruction or source step. |
| `next` | Step over the current call. |
| `out` | Run until the current frame returns. |
| `continue` | Resume until the next stop. |
| `stack` | Inspect the value stack. |
| `locals` | Inspect local slots. |
| `where` | Show the current source location. |
| `fuel` | Inspect or modify fuel state. |
| `epoch` | Inspect or modify epoch state. |

Additional inspection commands include `print`, `ip`, and `funcs` where supported by the active debugger mode.

## Fuel commands

- `fuel` shows remaining fuel and the check interval.
- `fuel set <n>` replaces the budget.
- `fuel add <n>` adds fuel.
- `fuel clear` disables metering.
- `fuel interval [n]` reads or changes the check interval.

## Epoch commands

- `epoch` shows the current epoch, deadline, and check interval.
- `epoch tick [n]` advances the shared epoch.
- `epoch deadline <n>` arms a relative deadline.
- `epoch clear` disables epoch interruption.
- `epoch interval [n]` reads or changes the checkpoint cadence.

Fuel and epoch semantics are documented in [Cooperative Scheduling](../cooperative-scheduling/).

## Recording and replay

Create a deterministic execution recording:

```powershell
pd-vm-run --record out/example.pdr examples/example.rss
```

Replay it without executing the source again:

```powershell
pd-vm-run --view-record out/example.pdr
```

Replay supports `break`, `break line`, `continue`, `step`, `next`, `out`, `stack`, `locals`, `print`, `ip`, `where`, and `funcs`. Replay breakpoints pause the recording stream; they do not install runtime VM breakpoints.

## Suspension visibility

The debugger reports `VmStatus::Yielded` for host, fuel, and epoch yields. `last_yield_reason()` distinguishes `Host`, `Fuel`, and `Epoch`. A pending asynchronous host operation produces `VmStatus::Waiting(op_id)` until the host completes or polls the operation.
