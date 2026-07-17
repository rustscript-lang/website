# Runtime implementations

## pd-edge

pd-edge has separate HTTP proxy, console, and sample echo-server binaries. Its data plane exposes protocol-specific execution through layered DAGs for TCP, UDP, TLS, HTTP, WebSocket, MQTT, and WebRTC. The host ABI is the contract between RSS programs and those runtime layers.

## pd-controller

pd-controller provides edge polling and result callbacks, administrative command queues, status and result queries, health and metrics endpoints, persistence, remote debug sessions, recordings, and a Web UI. Its deployment boundary is compiled bytecode delivered to active edges.

## micro-rustscript

micro-rustscript combines a bootloader, partition table, platform runtime, `pd-vm-nostd`, framework host bridge, and default VMBC program in its factory images. ESP32-C3 supports SD, flash-partition, and serial REPL startup paths; ESP32-S31 preview has a different target integration path.

## IronRust

IronRust contains a CLR value/runtime layer, VMBC-to-CLR compiler, runner, tests, and minimal HTTP proxy. Generated CLR assemblies use the runtime ABI and do not carry the original VMBC instruction stream. Typed CLR imports are generated from reachable `use System::...` declarations.

## Flint

Flint runs RSS programs through `ScriptRunner` and binds native GGML, llama.cpp, stable-diffusion.cpp, LibTorch, tokenizer, and safetensors capabilities. Native resources cross the VM boundary as opaque handles, while model architecture and generation loops remain in RSS.

## Sources

pd-edge README `Layered DAGs`, `ABI Source of Truth`, `Codebase Layout`; pd-controller README `Service guide`, `Web UI`; micro-rustscript README `Targets and source layout`; IronRust README `Projects`, `Current Status`; Flint README `How it works`, `Host functions`.
