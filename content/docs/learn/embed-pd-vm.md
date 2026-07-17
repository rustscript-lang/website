# Embed `pd-vm`

`pd-vm` is the RustScript virtual machine and compiler toolchain. An embedding application controls which host functions are registered and executes compiled RSS through the VM.

## Add dependencies

The RustScript README provides these dependency declarations:

```toml
rustscript = "0.22.2"
pd-vm = { git = "https://github.com/rustscript-lang/rustscript", package = "pd-vm" }
pd-host-function = { git = "https://github.com/rustscript-lang/rustscript", package = "pd-host-function" }
```

Source: [`rustscript/README.md`](https://github.com/rustscript-lang/rustscript/blob/9a4509b162fe4500fe91180f3e2ea9d0230df304/README.md#L16-L24). The dependency example was validated in a temporary Cargo project before publication.

## Compile and execute

An embedding application follows this boundary:

1. Compile RSS source with `pd-vm`.
2. Register only the host functions the application wants to expose.
3. Create a VM or store with the compiled program.
4. Run or resume execution and handle the returned status.

The [host functions reference](/docs/reference/host-functions/) documents namespaces, signatures, and capability boundaries. Use the [runtime controls reference](/docs/reference/runtime-controls/) for fuel, epoch interruption, recording, VMBC, JIT, WebAssembly, and `no_std` modes.

## Compatibility frontends

RustScript is the built-in `.rss` frontend. JavaScript and Lua use source-plugin crates and are compiled from an embedding application through `CompileSourceFileOptions::with_source_plugin(...)`.

## Source

RustScript README: `Crate usage`, `How To Use / Run Programs`, `Fuel Metering`, and `Internals / Compiler APIs`, revision `9a4509b162fe4500fe91180f3e2ea9d0230df304`.
