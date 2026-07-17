<!-- docs-title: Operations and control plane -->


## Quick Start

### HTTP Proxy Mode

1. Start proxy + admin endpoints:

```powershell
cargo run -p pd-edge --bin pd-edge-http-proxy
```

2. Compile and upload sample program:

```powershell
cargo run -p pd-edge --example build_sample_program
```

3. Send traffic to data plane:

```powershell
curl -i "http://127.0.0.1:8080/anything" -H "x-client-id: demo-client"
```

The sample program in `examples/http/proxy/sample_proxy_program.*` uses `rate_limit::allow` and writes response headers/body via `http::response::*`.

### Console Mode

Start the interactive console:

```powershell
cargo run -p pd-edge --bin pd-edge-console
```

Optional: preload a local source or `.vmbc` program:

```powershell
cargo run -p pd-edge --bin pd-edge-console -- --program path\to\program.rss
```

Interactive commands:

- `.help`
- `.status`
- `.load <PATH>`
- `.run`
- `.quit`

### Sample Echo Server

Start the multi-protocol sample server with all current listeners enabled:

```powershell
cargo run -p pd-edge --bin pd-edge-sample-echo-server --features "webrtc http2 mqtt"
```

Default listeners:

- TCP: `127.0.0.1:7001`
- UDP: `127.0.0.1:7002`
- TLS: `127.0.0.1:7003`
- HTTP: `127.0.0.1:7004`
- HTTPS: `127.0.0.1:7005`
- WebSocket: `127.0.0.1:7006`
- WSS: `127.0.0.1:7007`
- MQTT echo broker: `127.0.0.1:7010`
- MQTTS echo broker: `127.0.0.1:7011`
- WebRTC signaling: `http://127.0.0.1:7008/offer`
- CONNECT forward proxy: `127.0.0.1:7009`

Notes:

- With feature `http2`, the HTTP listener also accepts cleartext h2c prior-knowledge requests on the same port.
- With feature `http2`, the HTTPS listener negotiates `h2` or `http/1.1` via ALPN on the same port.
- Without feature `http2`, the HTTP and HTTPS listeners remain HTTP/1.1 only.
- With feature `mqtt`, the sample server also exposes local `mqtt://` and `mqtts://` echo brokers for outbound MQTT sample programs.
- The forward proxy listener accepts `CONNECT` and then tunnels raw TCP bytes, which makes it usable with `examples/proxy/forward/sample_forward_proxy_program.rss`.

## HTTP Proxy Admin API

Admin endpoints are served by `pd-edge-http-proxy` only:

- `PUT /program` (requires `content-type: application/octet-stream`)
- `GET /healthz`
- `GET /metrics`
- `GET /telemetry`
- `PUT /debug/session`
- `GET /debug/session`
- `DELETE /debug/session`

Program upload limit defaults to `1048576` bytes and can be changed with `--max-program-bytes`.

## CLI

### `pd-edge-http-proxy`

```text
Usage: pd-edge-http-proxy [options]

--proxy-addr <ADDR>                   Proxy/data-plane listen address (default: 0.0.0.0:8080)
--data-addr <ADDR>                    Alias for --proxy-addr
--admin-addr <ADDR>                   Admin listen address (default: 127.0.0.1:8081)
--max-program-bytes <BYTES>           Max program/upload size in bytes (default: 1048576)
--vm-fuel <UNITS>                     Enable cooperative VM fuel slices per request
--vm-fuel-check-interval <OPS>        Fuel check interval when --vm-fuel is enabled (default: 1)
--vm-epoch-deadline <TICKS>           Enable cooperative VM epoch slices per request (1 tick = 1ms wall clock)
--vm-epoch-check-interval <OPS>       Epoch check interval when --vm-epoch-deadline is enabled (default: 1)
--vm-execution-mode <MODE>            VM execution mode: async|threading (default: async)
--control-plane-url <URL>             Enable active control-plane RPC client
--edge-id <UUID>                      Explicit edge UUID for active control-plane mode
--edge-name <NAME>                    Edge display name (default: hostname)
--edge-id-path <PATH>                 UUID persistence path (default: .pd-edge/edge-id)
--control-plane-poll-interval-ms <MS> Poll interval for active control-plane mode
--control-plane-rpc-timeout-ms <MS>   RPC timeout for active control-plane mode
-V, --version
-h, --help
```

Notes:

- `--vm-fuel` and `--vm-epoch-deadline` are mutually exclusive.
- `--vm-fuel-check-interval` and `--vm-epoch-check-interval` are mutually exclusive.
- `--vm-epoch-check-interval` requires `--vm-epoch-deadline`.
- In epoch mode, the edge runtime advances the shared VM epoch every `1ms` with a Tokio timer, so `1` epoch tick maps to `1ms` of wall-clock time in `pd-edge`.

### `pd-edge-console`

```text
Usage: pd-edge-console [options]

--program <PATH>                      Optional source/.vmbc to load at startup
--max-program-bytes <BYTES>           Max program size in bytes (default: 1048576)
--vm-fuel <UNITS>                     Enable cooperative VM fuel slices per run
--vm-fuel-check-interval <OPS>        Fuel check interval when --vm-fuel is enabled (default: 1)
--vm-epoch-deadline <TICKS>           Enable cooperative VM epoch slices per run (1 tick = 1ms wall clock)
--vm-epoch-check-interval <OPS>       Epoch check interval when --vm-epoch-deadline is enabled (default: 1)
--control-plane-url <URL>             Enable active control-plane RPC client
--edge-id <UUID>                      Explicit edge UUID for active control-plane mode
--edge-name <NAME>                    Edge display name (default: hostname)
--edge-id-path <PATH>                 UUID persistence path (default: .pd-edge/edge-id)
--control-plane-poll-interval-ms <MS> Poll interval for active control-plane mode
--control-plane-rpc-timeout-ms <MS>   RPC timeout for active control-plane mode
-V, --version
-h, --help
```

The same interruption exclusivity rules apply in console mode: fuel and epoch cannot both be enabled for the same VM run.

### `pd-edge-sample-echo-server`

```text
Usage: pd-edge-sample-echo-server [options]

--tcp-addr <ADDR>                        TCP echo listen address (default: 127.0.0.1:7001)
--udp-addr <ADDR>                        UDP echo listen address (default: 127.0.0.1:7002)
--tls-addr <ADDR>                        TLS echo listen address (default: 127.0.0.1:7003)
--http-addr <ADDR>                       HTTP echo listen address (default: 127.0.0.1:7004)
--https-addr <ADDR>                      HTTPS echo listen address (default: 127.0.0.1:7005)
--http3-addr <ADDR>                      HTTP/3 echo listen address (default: 127.0.0.1:7005)
--websocket-addr, --ws-addr <ADDR>       WebSocket echo listen address (default: 127.0.0.1:7006)
--websocket-tls-addr, --wss-addr <ADDR>  Secure WebSocket echo listen address (default: 127.0.0.1:7007)
--mqtt-addr <ADDR>                       MQTT echo broker listen address (default: 127.0.0.1:7010)
--mqtts-addr <ADDR>                      Secure MQTT echo broker listen address (default: 127.0.0.1:7011)
--webrtc-addr <ADDR>                     WebRTC signaling listen address (default: 127.0.0.1:7008)
--forward-proxy-addr <ADDR>              CONNECT forward proxy listen address (default: 127.0.0.1:7009)
-V, --version
-h, --help
```

Notes:

- TLS, HTTPS, and WSS listeners use a generated self-signed certificate.
- With feature `http2`, the HTTP listener also accepts cleartext h2c prior knowledge.
- With feature `http2`, the HTTPS listener negotiates h2 or HTTP/1.1 via ALPN.
- With feature `http3`, the HTTP/3 listener speaks QUIC with ALPN `h3` on UDP.
- Without feature `http2`, the HTTP and HTTPS listeners serve HTTP/1.1 only.
- With feature `mqtt`, the MQTT listeners accept CONNECT, SUBSCRIBE, PUBLISH, PINGREQ, and DISCONNECT for local echo-broker testing.
- The forward proxy listener accepts `CONNECT` and then tunnels raw TCP bytes.
- The WebRTC listener accepts `POST /offer` and returns an SDP answer for a data-channel echo peer.
- Feature-gated listeners are only enabled when their crate feature is compiled in.

## Active Control-Plane RPC

Both binaries can run with active control-plane polling when `--control-plane-url` is set.

- Poll endpoint: `POST /rpc/v1/edge/poll`
- Result endpoint: `POST /rpc/v1/edge/result`

If `--control-plane-url` is not provided, control-plane-related flags are rejected.

Supported command types:

- `apply_program`
- `start_debug_session`
- `debug_command`
- `stop_debug_session`
- `get_health`
- `get_metrics`
- `get_telemetry`
- `ping`

`debug_command` supports both structured commands and raw debugger text. Raw text is passed through to the
interactive VM debugger, so remote clients can issue commands such as `epoch`, `epoch tick 1`,
`epoch deadline 3`, `epoch clear`, `fuel`, or `continue`.

### Example

```powershell
cargo run -p pd-edge --bin pd-edge-http-proxy -- `
  --control-plane-url "http://127.0.0.1:9100" `
  --edge-id "3f626ca0-c2ec-41a6-a5da-6fbc53aa857f" `
  --control-plane-poll-interval-ms "1000" `
  --control-plane-rpc-timeout-ms "5000"
```

## HTTP Proxy Performance Framework

Run the built-in framework to benchmark these scenarios:

- raw `pd-edge-http-proxy` (no program loaded)
- proxy with a compute-only program (no host calls; baseline workload)
- proxy with additive async HTTP host calls on top of the same workload (`get_method/get_path/get_header/get_body` + `set_header/set_body`) and explicit termination (no upstream target)
- direct plaintext HTTP upstream (`raw_http_upstream`)
- proxy with additive async HTTP host calls plus a real default-upstream plaintext HTTP round-trip (`host_calls_upstream_roundtrip`)
- direct HTTPS HTTP/2 upstream over TLS (`raw_http2_upstream`)
- proxy with additive async HTTP host calls plus an HTTPS HTTP/2 upstream round-trip over TLS (`host_calls_upstream_roundtrip_http2_upstream`)
- proxy with plaintext upstream and HTTPS HTTP/2 downstream over TLS (`host_calls_upstream_roundtrip_downstream_http2`)

Detailed report with charts: [`docs/HTTP_PROXY_PERF_REPORT_2026-03-14.md`](docs/HTTP_PROXY_PERF_REPORT_2026-03-14.md)
Generic `proxy::forward` experiment report: [`docs/HTTP_PROXY_PERF_REPORT_2026-03-15.md`](docs/HTTP_PROXY_PERF_REPORT_2026-03-15.md)

Harness A standard comparisons run with VM fuel disabled by default. Pass `--vm-fuel <UNITS>` to turn it on.

Build the proxy binary once before running benchmarks so the framework does not accidentally run a stale executable:

```bash
cargo build -p pd-edge --bin pd-edge-http-proxy --release
```

Standard mode comparison (same benchmark shape, different VM execution mode):

```bash
cargo run -p pd-edge --example http_proxy_perf_framework --release -- \
  --vm-execution-mode async \
  --no-vm-fuel \
  --requests 12000 \
  --warmup-requests 2000 \
  --concurrency 128 \
  --json-out target/http_proxy_perf_mode_async.json

cargo run -p pd-edge --example http_proxy_perf_framework --release -- \
  --vm-execution-mode threading \
  --no-vm-fuel \
  --requests 12000 \
  --warmup-requests 2000 \
  --concurrency 128 \
  --json-out target/http_proxy_perf_mode_threading.json
```

Fuel-impact latency sweep (proxy harness, scenario `no_host_calls_program`):

```bash
cargo run -p pd-edge --example http_proxy_perf_framework --release -- \
  --vm-execution-mode async \
  --fuel-latency-sweep \
  --scenario no_host_calls_program \
  --vm-fuel 50000 \
  --requests 3000 \
  --warmup-requests 300 \
  --concurrency 64 \
  --fuel-latency-fuels "1,2,4,8,10,16,32,64,512,4096,50000" \
  --fuel-latency-check-intervals "1,4,16,64" \
  --json-out target/http_proxy_fuel_sweep_async.json

cargo run -p pd-edge --example http_proxy_perf_framework --release -- \
  --vm-execution-mode threading \
  --fuel-latency-sweep \
  --scenario no_host_calls_program \
  --vm-fuel 50000 \
  --requests 3000 \
  --warmup-requests 300 \
  --concurrency 64 \
  --fuel-latency-fuels "1,2,4,8,10,16,32,64,512,4096,50000" \
  --fuel-latency-check-intervals "1,4,16,64" \
  --json-out target/http_proxy_fuel_sweep_threading.json
```

Second harness (VM-only microbenchmark in `pd-vm`):

```bash
cargo test -p pd-vm --release --test jit_tests perf_cooperative_fuel_configuration_impacts_latency -- --ignored --nocapture
```
