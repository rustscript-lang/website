# pd-edge

[![pd-edge on crates.io](https://img.shields.io/crates/v/pd-edge.svg)](https://crates.io/crates/pd-edge)

`pd-edge` is the edge data-plane runtime plus the edge ABI for running VM programs at the edge.

## Cargo usage

The workspace uses sibling RustScript crates during local development. For downstream Cargo manifests, use these repository references:

```toml
pd-vm = { git = "https://github.com/rustscript-lang/rustscript", package = "pd-vm" }
pd-edge-abi = { git = "https://github.com/rustscript-lang/pd-edge", package = "pd-edge-abi" }
pd-edge = { git = "https://github.com/rustscript-lang/pd-edge", package = "pd-edge" }
```

## Test

```bash
cargo test --workspace 
cargo build --workspace --release 
```

## Runtime guide

`pd-edge` is the edge runtime crate for running VM programs at the edge.

This crate now ships three binaries with different scopes:

- `pd-edge-http-proxy`: full HTTP data plane runtime (proxy path + admin API + optional active control-plane client)
- `pd-edge-console`: interactive local console runtime (stdin/stdout/stderr host APIs + optional active control-plane client)
- `pd-edge-sample-echo-server`: local multi-protocol echo server for manual transport and host-ABI testing

## Contents

- [Binary Scope](#binary-scope)
  - [pd-edge-http-proxy](#pd-edge-http-proxy)
  - [pd-edge-console](#pd-edge-console)
  - [pd-edge-sample-echo-server](#pd-edge-sample-echo-server)
- [Quick Start](#quick-start)
  - [HTTP Proxy Mode](#http-proxy-mode)
  - [Console Mode](#console-mode)
  - [Sample Echo Server](#sample-echo-server)
- [HTTP Proxy Admin API](#http-proxy-admin-api)
- [CLI](#cli)
  - [pd-edge-http-proxy](#pd-edge-http-proxy-1)
  - [pd-edge-console](#pd-edge-console-1)
  - [pd-edge-sample-echo-server](#pd-edge-sample-echo-server-1)
- [Active Control-Plane RPC](#active-control-plane-rpc)
  - [Example](#example)
- [HTTP Proxy Performance Framework](#http-proxy-performance-framework)
- [Layered DAGs](#layered-dags)
- [ABI Source of Truth](#abi-source-of-truth)
- [Release Artifacts](#release-artifacts)
- [Docker](#docker)
- [Codebase Layout](#codebase-layout)

## Binary Scope

### `pd-edge-http-proxy`

- Handles HTTP traffic on a data plane listener
- Exposes local admin APIs for program upload, health, metrics, telemetry, and debug session lifecycle
- Can run standalone (admin upload only) or with active control-plane RPC
- Registers HTTP host ABI + runtime host ABI + built-in IO overrides

Default listeners:

- Data plane: `0.0.0.0:8080`
- Admin API: `127.0.0.1:8081`

### `pd-edge-console`

- No HTTP proxy listeners
- Runs an interactive shell to load and execute VM programs locally
- Supports console host APIs: `console::stdin::read_line()`, `console::stdin::read_all()`, `console::stdout::write(text)`, `console::stdout::flush()`, `console::stderr::write(text)`, `console::stderr::flush()`
- Registers runtime host ABI (`runtime::sleep`, `rate_limit::allow`) plus the console host APIs above

### `pd-edge-sample-echo-server`

- Starts separate listeners for TCP, UDP, TLS, HTTP, HTTPS, WebSocket, secure WebSocket, MQTT, MQTTS, WebRTC signaling, and a CONNECT forward proxy
- Echoes request bytes, datagrams, HTTP bodies, WebSocket frames, and WebRTC data-channel messages
- Uses a generated self-signed certificate for TLS, HTTPS, and `wss://`
- Enables manual end-to-end testing of the feature-gated transport surfaces without uploading a VM program
