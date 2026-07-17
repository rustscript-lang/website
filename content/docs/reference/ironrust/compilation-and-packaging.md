<!-- docs-title: Compilation and packaging -->


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
