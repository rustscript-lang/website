# Flint

[![Crates.io](https://img.shields.io/crates/v/rs-flint.svg)](https://crates.io/crates/rs-flint)

> Flint is all you need to light the Torch.

Flint is a RustScript-native AI inference framework. It exposes Torch tensor
operations, llama.cpp model primitives, stable-diffusion.cpp image generation,
GGML backend discovery, tokenization, and safetensors I/O as composable host
functions. Model architecture, sampling loops, and inference workflows remain
in [RustScript](https://github.com/rustscript-lang/rustscript), while the Rust
library manages native resources through
[`koharu`](https://github.com/mayocream/koharu) and executes scripts with the
RustScript VM.

## How it works

Flint compiles a RustScript program and runs it with `ScriptRunner`, which binds
the `flint::*` host functions listed below. `ScriptRunner::new()` executes
native GGML, llama.cpp, and stable-diffusion.cpp programs without initializing
LibTorch. `ScriptRunner::with_device(device).await` initializes LibTorch and
executes tensor programs on the selected CPU, CUDA, MPS, or Vulkan device.

Tensor and pair values cross the VM boundary as opaque integer handles. A
RustScript program uses those handles to compose a graph, then publishes its
result with `flint::runtime::set_output` or
`flint::runtime::set_text_output`. Torch safetensors weights are loaded directly
onto the selected device and reused by handle during the run. Native model
resources retain their upstream formats, including quantized GGUF tensors.

A typical integration follows this flow:

1. Compile a `.rss` source file with RustScript.
2. Create `ScriptRunner::new()` for native programs or
   `ScriptRunner::with_device(device).await` for Torch programs.
3. Pass the compiled program and string arguments to `run_text`.
4. Read the published text from `ScriptTextOutput`.

## Installation

Install the CLI from crates.io:

```text
cargo install rs-flint
```

Add Flint as a library dependency with `cargo add rs-flint`; the Rust crate is
imported as `flint_ai`.

`cargo install` installs the runner binary. The commands below assume a Flint
repository checkout so the referenced files under `scripts/` are available;
`--script` also accepts an absolute path to an RSS program.

## Release Archives

Release assets are zip archives containing the runner and its native Koharu
shims. LibTorch, llama.cpp, and stable-diffusion.cpp are fetched by
`koharu-runtime` on first use and stored next to the executable under `store`.
The `macos-arm64` runner uses Apple Silicon LibTorch with its MPS backend,
which uses Metal; run Torch scripts with `--device mps`. The `windows-x86_64`
runner is built against CUDA 13 LibTorch; with a compatible NVIDIA driver,
Torch scripts can use `--device cuda` or `--device cuda:N`.
