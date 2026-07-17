# Runtime guides

## pd-edge

`pd-edge` is the edge data-plane runtime and edge ABI for VM programs. It provides an HTTP proxy runtime, an interactive console runtime, and a multi-protocol sample echo server.

```bash
cargo run -p pd-edge --bin pd-edge-console -- --help
```

For HTTP proxy, console, admin API, active control-plane RPC, Docker, protocol DAGs, and release artifacts, use [pd-edge](/docs/reference/pd-edge/) and the [runtime implementation guide](/docs/contribute/runtimes/#pd-edge).

## pd-controller

`pd-controller` is the control-plane service for pd-edge data planes. It supplies edge polling and result callbacks, program and debug-session orchestration, health and metrics endpoints, and a Web UI.

```bash
cargo run -p pd-controller
```

The controller listens on `0.0.0.0:9100` by default and serves a built Web UI under `/ui`. Operational details are in [pd-controller](/docs/reference/pd-controller/).

## micro-rustscript

micro-rustscript runs VMBC on ESP32-C3, ESP32-S31 preview hardware, and a native Arduino simulator. ESP32-C3 loads `/rustscript/main.vmbc` from SD, then its dedicated flash partition, then the serial VMBC REPL.

```bash
pio run -e arduino
```

The Arduino target builds the bridge and a compiled VMBC program on the host. A successful simulator run finishes with `rss:status=0`. See [micro-rustscript](/docs/reference/micro-rustscript/) for target images, VMBC partition replacement, and the serial REPL.

## IronRust

IronRust provides a RustScript runtime and compiler for Microsoft CLR. `PdVm.Compiler` converts VMBC to CLR assemblies, while `PdVm.Runner` supports compile, run, and compile-run workflows.

```powershell
dotnet build IronRust.sln
```

IronRust requires the .NET 10 SDK. Build the solution first; then use `PdVm.Runner` to compile or run RSS and VMBC programs. The typed CLR wrapper discovers reachable `use System::...` imports and generates bindings for supported public members. Dynamic reflection requires explicit `--enable-dynamic-dotnet`. See [IronRust](/docs/reference/ironrust/).

## Flint

Flint is a RustScript-native AI inference framework. It exposes Torch tensor operations, llama.cpp primitives, stable-diffusion.cpp image generation, GGML discovery, tokenization, and safetensors I/O as host functions.

Use [Flint](/docs/reference/flint/) for the current CLI invocation, host namespaces, and model-specific RSS programs. `--llm` selects Torch-based RSS programs, `--llama` selects llama.cpp programs, and `--sd` selects stable-diffusion.cpp or GGML programs. Scripts keep model architecture, sampling loops, and inference workflows in RSS.
