<!-- docs-title: ABI and distribution -->


## ABI Source of Truth

Host-call ABI metadata is centralized in `pd-edge-abi`:

- Rust constants + metadata: `edge_abi::FUNCTIONS`
- ABI version: `edge_abi::ABI_VERSION`
- Manifest: [`pd-edge-abi/abi.json`](../pd-edge-abi/abi.json)

For embedding with a VM:

```rust
let async_ops = edge::new_shared_vm_async_ops();
edge::register_http_plane_host_module(&mut vm, context, async_ops)?;
```

Use `register_host_module` when only runtime ABI is needed.

## Release Artifacts

Release workflow publishes Linux tarballs for:

- `pd-edge-http-proxy-<tag>-linux-x86_64.tar.gz`
- `pd-edge-console-<tag>-linux-x86_64.tar.gz`
- `pd-controller-<tag>-linux-x86_64.tar.gz`
- `pd-vm-run-<tag>-linux-x86_64.tar.gz`

## Docker

Docker release image currently packages `pd-edge-http-proxy`:

- `fffonion/pd-edge:<tag>`
- `fffonion/pd-edge:latest`

Run:

```powershell
docker run --rm -p 8080:8080 -p 8081:8081 fffonion/pd-edge:latest
```

## Codebase Layout

- `examples/README.md`: categorized sample program index for console, HTTP, MQTT, transport, proxy, WebSocket, and WebRTC examples
- `src/bin/pd-edge-http-proxy.rs`: HTTP proxy binary entrypoint and CLI
- `src/bin/pd-edge-console.rs`: console binary entrypoint and CLI
- `src/bin/pd-edge-sample-echo-server.rs`: multi-protocol sample echo server binary and CLI
- `src/sample_echo.rs`: shared TCP/UDP/TLS/HTTP/WebSocket/WebRTC sample echo server implementation
- `src/runtime.rs`: shared runtime state, telemetry, program apply/load, exports
- `src/runtime/http_plane/`: HTTP data/admin plane handlers
- `src/abi_impl/runtime.rs`: protocol-independent runtime host ABI
- `src/abi_impl/transport/`: TCP/TLS/UDP transport DAG state and host ABI
- `src/abi_impl/http/`: HTTP-specific host ABI
- `src/abi_impl/websocket/`: WebSocket DAG state and host ABI
- `src/abi_impl/mqtt/`: MQTT session DAG state, codec, and host ABI
- `src/abi_impl/webrtc/`: WebRTC DAG state and host ABI
- `src/active_control_plane.rs`: active control-plane poll/report loop
- `src/debug_session.rs`: on-demand debug session lifecycle
