# Flint reference

## Runtime model

Flint runs RSS through `ScriptRunner` and resolves host functions through `HostRuntime`. It discovers linked backends, creates native resources, registers host namespaces, compiles a script, and invokes the selected entrypoint. Native resources cross the VM boundary as opaque handles.

## Installation and distribution

The README documents installation, release archives, the CLI, RSS command-line arguments, and model-specific command families. The CLI selects Torch, llama.cpp, stable-diffusion.cpp, GGML, and related workflows according to the requested runtime and script.

## Host-function namespaces

Flint documents host interfaces for CLI arguments, runtime handles, GGML discovery, diffusion, llama.cpp, cache, tokenizer, safetensors weights, pair helpers, tensor operations, neural-network operations, vision operations, and configuration. These names are host contracts; availability depends on the selected backend and built release.

## Script ownership

Model architecture, loops, generation, tokenization workflow, and inference policy stay in RSS. Native host functions provide model loading, tensors, sampling primitives, image generation, resource handles, and backend integration.
