<!-- docs-title: pd-vm-run -->

Download `pd-vm-run` from [RustScript releases](https://github.com/rustscript-lang/rustscript/releases).

## Run an RSS program

Use the released binary as the entrypoint:

```powershell
pd-vm-run examples/example.rss
```

Set a fuel budget or script call-depth limit when the program needs explicit runtime bounds:

```powershell
pd-vm-run --fuel 100000 --max-call-depth 256 examples/example.rss
```

Compatibility frontends such as JavaScript and Lua are supplied by source-plugin crates. The standalone RustScript binary loads `.rss`; embedding applications use `CompileSourceFileOptions::with_source_plugin(...)` for plugin-backed source files.

## REPL

Running the binary without arguments opens the RustScript REPL. The explicit forms are equivalent:

```powershell
pd-vm-run repl
pd-vm-run --repl
```

The REPL keeps history, supports multiline input, and recognizes `.help`, `.quit`, and `.cancel`.

## Format source

Format a source file in place:

```powershell
pd-vm-run fmt examples/example.rss
```

Check formatting without changing the file:

```powershell
pd-vm-run fmt --check examples/example.rss
```

## Emit and inspect VMBC

Emit VMBC wire-format bytecode without running it:

```powershell
pd-vm-run --emit-vmbc out/example.vmbc examples/example.rss
```

Disassemble VMBC:

```powershell
pd-vm-run --disasm-vmbc out/example.vmbc
```

Include embedded source when the artifact contains it:

```powershell
pd-vm-run --disasm-vmbc out/example.vmbc --show-source
```

See [Bytecode](../bytecode/) for the `Program`, opcode, assembler, and VMBC layout.

## Record and replay

Record execution to a `.pdr` file:

```powershell
pd-vm-run --record out/example.pdr examples/example.rss
```

Open the recording in replay mode:

```powershell
pd-vm-run --view-record out/example.pdr
```

Replay supports breakpoints, stepping, stack and local inspection, instruction-pointer lookup, and function listing. See [Debugger](../debugger/) for commands and TCP debugging.

## Native execution flags

Use AOT execution for the current source, save an artifact, or load one:

```powershell
pd-vm-run --aot examples/example.rss
pd-vm-run --aot --aot-save out/example.pat examples/example.rss
pd-vm-run --aot-load out/example.pat
```

Inspect trace-JIT activity:

```powershell
pd-vm-run --jit-hot-loop 2 --jit-dump examples/example.rss
```

See [JIT and AOT](../jit-aot/) for backend behavior, artifacts, diagnostics, and current NYI coverage.

## Cooperative execution flags

`--fuel <n>` sets the initial fuel budget. `--epoch-deadline <n>` arms epoch interruption, and `--epoch-check-interval <n>` configures its checkpoint cadence. Fuel and epoch interruption are mutually exclusive.

See [Cooperative Scheduling](../cooperative-scheduling/) for resume behavior and the Rust APIs.

## Help and version

```powershell
pd-vm-run --help
pd-vm-run --version
```

Release binaries report tag and build metadata. CI publishes platform-specific `pd-vm-run` assets for tagged releases.
