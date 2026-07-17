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
