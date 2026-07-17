<!-- docs-title: Operations -->


## Run The Minimal HTTP Proxy

Run with a precompiled `VMBC` program:

```powershell
dotnet run --project PdEdge.Http -- `
  --program-vmbc path\to\program.vmbc `
  --data-addr 127.0.0.1:8080
```

Run with a source program:

```powershell
dotnet run --project PdEdge.Http -- `
  --program-source path\to\program.rss `
  --data-addr 127.0.0.1:8080
```

Useful flags:

- `--proxy-addr <ADDR>`
  - Alias for `--data-addr`.
- `--vm-execution-mode async|threading`
  - Request-time VM execution strategy.
- `--max-steps <N>`
  - Per-request instruction cap. Default is `10000000`.
- `--disable-logging`
  - Suppresses console log output.

Compatibility flags accepted for parity with `pd-edge-http-minimal`:

- `--vm-fuel`
- `--vm-fuel-check-interval`
- `--vm-jit`

These are currently parsed but treated as no-ops in the CLR runtime.

## PdEdge.Http Scope

`PdEdge.Http` is intentionally minimal:

- HTTP/1.1 only
- No admin API
- No metrics
- No debugger
- No control plane
- No TLS
- No HTTP/2
- No HTTP/3

It supports the minimal host surface needed for the standalone proxy flow:

- request getters such as `http::request::get_method`, `get_path`, `get_header`, `get_body`
- response setters such as `http::response::set_status`, `set_header`, `set_headers`, `set_body`
- default upstream preparation via `http::exchange::prepare_default_upstream`
- native forwarding via `proxy::stream::*` and `proxy::forward_native`

## Benchmark With The Existing Rust Harness

Build the proxy in Release first:

```powershell
dotnet build PdEdge.Http\PdEdge.Http.csproj -c Release
```

Then run the Rust benchmark harness against the built executable:

```powershell
cargo run -p pd-edge --example http_proxy_perf_framework -- `
  --binary d:\Workspace\project-d\PdEdge.Http\bin\Release\net10.0\pd-edge-http-minimal-clr.exe `
  --skip-build `
  --scenario http_proxy `
  --requests 2000 `
  --warmup-requests 200 `
  --concurrency 32
```

Body-read scenario:

```powershell
cargo run -p pd-edge --example http_proxy_perf_framework -- `
  --binary d:\Workspace\project-d\PdEdge.Http\bin\Release\net10.0\pd-edge-http-minimal-clr.exe `
  --skip-build `
  --scenario http_proxy_body_read `
  --requests 2000 `
  --warmup-requests 200 `
  --concurrency 32
```

## Current Status

- VMBC is decoded only during compilation. Generated assemblies contain CLR control flow, CLR evaluation locals, generated local fields, and direct intrinsic calls; they do not contain a VMBC instruction stream.
- Typed arithmetic and comparison hints lower to native CLR opcodes. Dynamic values use focused operations from `PdVm.Runtime` rather than an instruction interpreter.
- The operand stack is materialized into runtime state only at halt, host-call, async-resume, and instruction-budget boundaries.
- `PdEdge.Http` local-response and native-forward proxy paths are covered by tests.
- The Rust HTTP perf harness can drive the CLR proxy binary directly.
