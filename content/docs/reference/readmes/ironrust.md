# IronRust

IronRust is the RustScript runtime and compiler for Microsoft CLR. The repository includes the CLR runtime, bytecode-to-CLR compiler, runner CLI, tests, examples, and a minimal Edge HTTP runtime.

## Projects

- `PdVm.Runtime`
  - CLR-side VM value model, builtin implementations, host dispatch, and program execution helpers.
- `PdVm.Compiler`
  - Reads `VMBC` bytecode and emits CLR assemblies (`.dll`) that implement `IPdVmProgram`.
- `PdVm.Runner`
  - Small CLI for compile/run/compile-run flows.
- `PdEdge.Http`
  - Minimal HTTP/1 proxy runtime for PD Edge scripts on CLR.
  - Project name is `PdEdge.Http`, but the built executable name is `pd-edge-http-minimal-clr` so the existing Rust perf harness can target it directly.
- `PdVm.Tests`
  - Compiler/runtime tests.
- `PdEdge.Http.Tests`
  - HTTP proxy parity tests.

## Requirements

- .NET 10 SDK
- Rust toolchain only if you want to run the Rust HTTP perf harness

`PdEdge.Http --program-source ...` compiles RustScript in-process through `PdVm.Compiler`. It does not launch Cargo or require the `pd-edge` Rust workspace at runtime.

## Build

From the repo root:

```powershell
dotnet build IronRust.sln
```

Release build for the proxy runtime:

```powershell
dotnet build PdEdge.Http\PdEdge.Http.csproj -c Release
```

## Test

Build first, then run tests without rebuilding:

```powershell
dotnet test IronRust.sln --no-build
```

Or run just the HTTP runtime tests:

```powershell
dotnet test PdEdge.Http.Tests\PdEdge.Http.Tests.csproj --no-build
```

## Compile Source To VMBC

`PdVm.Runner` calls the bundled native compiler library in-process. A separate `pd-vm-run` executable is not required:

```powershell
PdVm.Runner.exe emit-vmbc `
  path\to\program.rss `
  path\to\program.vmbc
```

Managed callers can use `PdVmNativeCompiler.CompileFile` or `CompileFileToVmbc` from `PdVm.Compiler.dll`. The packaged native library is named `Pdvm.Compiler.Native.dll` on Windows, `libPdvm.Compiler.Native.dylib` on macOS, and `libPdvm.Compiler.Native.so` on Linux. The native ABI returns VMBC bytes or a UTF-8 diagnostic and releases result buffers through the matching Rust export.

The same compiler path can produce VMBC for a PD Edge HTTP proxy script:

```powershell
PdVm.Runner.exe emit-vmbc `
  path\to\program.rss `
  path\to\program.vmbc
```

`PdEdge.Http` validates the compiled host imports against its supported Edge ABI before accepting the program.

Example source files are in `examples/`:

- `pdedge-http-local-ok.rss`
- `pdedge-http-proxy-http1.rss`
- `pdedge-http-proxy-http1-body-read.rss`

## Compile VMBC To CLR

Compile RustScript source with generated typed .NET modules and the unmodified upstream compiler:

```powershell
dotnet run --project PdVm.Runner -- compile-source `
  examples\dotnet-typed-console.rss `
  artifacts\dotnet-typed-console.dll
dotnet run --project PdVm.Runner -- run artifacts\dotnet-typed-console.dll
```

`run` also accepts an `.rss` source file and compiles it to a temporary CLR assembly before execution:

```powershell
dotnet run --project PdVm.Runner -- run examples\dotnet-typed-console.rss
dotnet run --project PdVm.Runner -- run examples\dotnet-typed-winforms.rss --profile winforms
```

`dotnet-typed-winforms.rss` is a Notepad-style Windows application written in RustScript. It creates the form, menus, editor, dialogs, file actions, font and color actions, word-wrap action, and status bar in `.rss`. The typed Windows Forms profile supplies CLR bindings, a dedicated STA dispatcher, and a thin event queue; it does not contain application behavior.

The `winforms` profile includes the common profile and the initial Windows Forms surface:

```powershell
dotnet run --project PdVm.Runner -- compile-source `
  examples\dotnet-typed-winforms.rss `
  artifacts\dotnet-typed-winforms.dll `
  --profile winforms
dotnet run --project PdVm.Runner -- run artifacts\dotnet-typed-winforms.dll
```

`--pd-vm-library <path>` selects an explicit native compiler library; `--source-root <path>` sets the module-tree root. By default the native library is loaded beside the Runner. Typed imports carry exact CLR assembly, module, type, member, parameter, and return identities. Name-based dynamic reflection remains behind `--enable-dynamic-dotnet`.

Typed CLR imports use the C#-style `System` root. The source wrapper scans each reachable `use System::...` declaration, finds the concrete CLR type in the .NET runtime or a referenced DLL, and generates an exact typed module for its supported public members:

```rust
use System::Security::Cryptography::SHA256;

let algorithm = SHA256::Create();
SHA256::Release(algorithm);
```

For a third-party CLR assembly, place its DLL beside the source, under the source tree, beside the Runner, or in the current working directory. The wrapper finds it from the imported CLR type name, copies the selected DLL beside the generated program, and registers that output directory for runtime resolution:

```powershell
dotnet run --project PdVm.Runner -- compile-source crypto.rss crypto.dll
```

## Release packages

The Release workflow builds `win-x64`, `osx-arm64`, and `linux-x64` packages. Each archive contains the framework-dependent `PdVm.Runner` executable, managed DLLs and portable PDBs, runtime configuration, and the platform native compiler library. The Windows archive also contains the native PDB.

Build a package locally with:

```powershell
.\scripts\package-release.ps1 `
  -RuntimeIdentifier win-x64 `
  -RustTarget x86_64-pc-windows-msvc
```

Compile a `VMBC` file to a CLR assembly:

```powershell
dotnet run --project PdVm.Runner -- compile input.vmbc output.dll
```

Compilation writes `PdVm.Runtime.dll` beside the generated program assembly. The generated assembly references the runtime ABI but has no dependency on `PdVm.Compiler` or the original VMBC payload.

Run a compiled CLR assembly:

```powershell
dotnet run --project PdVm.Runner -- run output.dll
```

Compile and run in one step:

```powershell
dotnet run --project PdVm.Runner -- compile-run input.vmbc output.dll
```

Optional execution cap:

```powershell
dotnet run --project PdVm.Runner -- run output.dll --max-steps 1000000
```

`--max-steps` is enforced by budget checks in the generated CLR method. Backward branches remain native CLR branches and do not return to the C# execution driver.

Experimental dynamic .NET reflection is available only when explicitly enabled:

```powershell
dotnet run --project PdVm.Runner -- run output.dll --enable-dynamic-dotnet
```

This mode is intended for interop development and the WinForms smoke example. It is not the typed wrapper described in `docs/dotnet-interop-wrapper-plan.md` and must not be used for untrusted programs.

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
