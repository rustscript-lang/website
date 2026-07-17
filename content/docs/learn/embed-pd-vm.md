# Embed `pd-vm`

`pd-vm` is the RustScript virtual machine and compiler toolchain. An embedding application controls which host functions are registered and executes compiled RSS through the VM.

## Add dependencies

The RustScript README provides these dependency declarations:

```toml
rustscript = "0.22.2"
pd-vm = { git = "https://github.com/rustscript-lang/rustscript", package = "pd-vm" }
pd-host-function = { git = "https://github.com/rustscript-lang/rustscript", package = "pd-host-function" }
```

## Compile and execute

An embedding application follows this boundary:

1. Compile RSS source with `pd-vm`.
2. Register only the host functions the application wants to expose.
3. Create a VM or store with the compiled program.
4. Run or resume execution and handle the returned status.

The [host functions](/docs/reference/host-functions/) document namespaces, signatures, and capability boundaries. Use [runtime controls](/docs/reference/runtime-controls/) for fuel, epoch interruption, recording, VMBC, JIT, WebAssembly, and `no_std` modes.

## Compatibility frontends

RustScript is the built-in `.rss` frontend. JavaScript and Lua use source-plugin crates and are compiled from an embedding application through `CompileSourceFileOptions::with_source_plugin(...)`.
