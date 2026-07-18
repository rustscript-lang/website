<!-- docs-title: runtime -->

`runtime`

Default controls for sleeping and terminating the current VM invocation.

The `runtime` namespace is available directly; no `use` declaration is required.

## Functions

| Function | Description |
| --- | --- |
| [`sleep`](#sleep) | Sleeps for the requested milliseconds. |
| [`exit`](#exit) | Halts the current VM invocation immediately. |

## Function details

### `sleep`

```rss
fn sleep(ms: int) -> bool
```

Sleeps for the requested milliseconds.

### `exit`

```rss
fn exit() -> unknown
```

Halts the current VM invocation immediately.
