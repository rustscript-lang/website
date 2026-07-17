# pd-edge

## Runtime scope

pd-edge is the RustScript edge data-plane runtime. It has three runnable binaries: the HTTP proxy, the interactive console, and the multi-protocol sample echo server. The HTTP proxy accepts downstream traffic, executes RustScript through the edge ABI, and forwards traffic upstream. The console runs scripts interactively. The echo server demonstrates the protocol stack.

## Operations

The runtime documentation covers HTTP proxy mode, console mode, the sample echo server, the proxy administrative API, CLI configuration, active control-plane RPC, Docker packaging, and release artifacts. The controller is optional: pd-edge can run standalone or connect to pd-controller for polling, bytecode application, result reporting, and remote debugging.

## Protocol execution

The transport implementation has dedicated DAGs for TCP, UDP, TLS, HTTP, WebSocket, MQTT, and WebRTC. A protocol transition enters or leaves a deeper DAG; downstream and upstream progress independently. The generic advancement mechanism controls when a DAG step advances, yields, or completes.

## ABI and maintenance

The edge ABI is the source of truth for host functions visible to an RSS program. Preserve ABI compatibility when changing host namespaces, transport state, data-plane behavior, or program artifacts. The codebase separates binaries, ABI crates, HTTP, console, proxy, transport, protocol, and test support.

## Performance framework

The repository includes an HTTP proxy performance framework for comparing runtime modes and exercising proxy behavior under load.
