<!-- docs-title: jit -->

`jit`

JIT control builtin namespace.

**Runtime support:** native and WebAssembly.

## Import

```rss
use jit;
```

## Functions

| Function | Description |
| --- | --- |
| [`set_config`](#set-config) | Sets the JIT runtime configuration from a map. |
| [`get_config`](#get-config) | Returns the current JIT runtime configuration as a map. |
| [`set_enabled`](#set-enabled) | Enables or disables the JIT at runtime. |
| [`get_enabled`](#get-enabled) | Returns whether the JIT is enabled at runtime. |
| [`set_hot_loop_threshold`](#set-hot-loop-threshold) | Sets the loop-hotness threshold used by the JIT. |
| [`get_hot_loop_threshold`](#get-hot-loop-threshold) | Returns the loop-hotness threshold used by the JIT. |
| [`set_max_trace_len`](#set-max-trace-len) | Sets the maximum trace length used by the JIT. |
| [`get_max_trace_len`](#get-max-trace-len) | Returns the maximum trace length used by the JIT. |

## Function details

### `set_config`

```rss
fn set_config(enabled: bool, hot_loop_threshold: int, max_trace_len: int) -> map
```

Sets the JIT runtime configuration from a map.

### `get_config`

```rss
fn get_config() -> map
```

Returns the current JIT runtime configuration as a map.

### `set_enabled`

```rss
fn set_enabled(enabled: bool) -> bool
```

Enables or disables the JIT at runtime.

### `get_enabled`

```rss
fn get_enabled() -> bool
```

Returns whether the JIT is enabled at runtime.

### `set_hot_loop_threshold`

```rss
fn set_hot_loop_threshold(hot_loop_threshold: int) -> int
```

Sets the loop-hotness threshold used by the JIT.

### `get_hot_loop_threshold`

```rss
fn get_hot_loop_threshold() -> int
```

Returns the loop-hotness threshold used by the JIT.

### `set_max_trace_len`

```rss
fn set_max_trace_len(max_trace_len: int) -> int
```

Sets the maximum trace length used by the JIT.

### `get_max_trace_len`

```rss
fn get_max_trace_len() -> int
```

Returns the maximum trace length used by the JIT.
