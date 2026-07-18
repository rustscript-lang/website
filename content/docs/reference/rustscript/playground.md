<!-- docs-title: Playground -->

Open the hosted RustScript Playground at [playground.rustscript.org](https://playground.rustscript.org/).

The web application source is maintained in [rustscript-lang/playground](https://github.com/rustscript-lang/playground).

## Browser runtime

The playground uses the `pd-vm-wasm` crate with its `runtime` feature. It exposes two browser-facing entrypoints:

- `lint_source_json` parses and compiles source, returning Monaco-friendly diagnostics.
- `run_source_json` compiles and executes source in the wasm runtime.

The wasm runtime omits the native JIT backend. It retains source compilation, bytecode execution, runtime output, and cooperative interruption controls supported by the browser integration.

## Lint diagnostics

The linter reports parse errors and compile-time type errors with line and span metadata. This includes inferred-type failures such as incompatible `if` and `else` branch merges.

Compatibility-language parsing is provided through source-plugin integration. The core `.rss` frontend remains built in.

## Monaco integration

The playground uses Monaco grammar assets from `editor-assets/monaco`. The application loads the generated wasm module, sends source through the lint or run JSON API, and maps diagnostics back to editor markers.

## Epoch mode in the browser

In epoch mode, the playground advances one epoch tick from a 1ms JavaScript timer and displays the live counter in the interruption panel.

Browser timers run on the main thread. A compute-only wasm call can occupy that thread, so timer delivery cannot preempt the VM in the middle of the same synchronous JavaScript-to-wasm call. Epoch ticks take effect when control reaches a checkpoint and the event loop has had an opportunity to advance the counter.

## Related runtime pages

- [pd-vm-run](../pd-vm-run/) covers the released native binary.
- [Cooperative Scheduling](../cooperative-scheduling/) defines fuel and epoch behavior.
- [VM API](../vm-api/) covers Rust embedding APIs.
