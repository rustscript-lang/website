# Use in Rust projects

`pd-vm` is the RustScript virtual machine and compiler toolchain. An embedding application controls which host functions are registered and executes compiled RSS through the VM.

## Add dependencies

The RustScript README provides these dependency declarations:

```toml
rustscript = "0.22.2"
pd-vm = { git = "https://github.com/rustscript-lang/rustscript", package = "pd-vm" }
pd-host-function = { git = "https://github.com/rustscript-lang/rustscript", package = "pd-host-function" }
```

## Compile and execute

This complete Rust program compiles an inline RustScript program, runs it until it halts, and reads the result from the VM stack:

```rust
use rustscript::{Value, Vm, VmStatus, compile_source};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let compiled = compile_source(
        r#"
        let answer: int = 40 + 2;
        answer;
        "#,
    )?;
    let mut vm = Vm::new(compiled.program);

    loop {
        match vm.run()? {
            VmStatus::Halted => break,
            VmStatus::Yielded => continue,
            VmStatus::Waiting(_) => vm.wait_for_host_op_blocking()?,
        }
    }

    assert_eq!(vm.stack(), [Value::Int(42)]);
    println!("RustScript result: {:?}", vm.stack());
    Ok(())
}
```

Running it with `cargo run` prints `RustScript result: [Int(42)]`.

An embedding application follows this boundary:

1. Compile RSS source with `pd-vm`.
2. Register only the host functions the application wants to expose.
3. Create a VM or store with the compiled program.
4. Run or resume execution and handle the returned status.

The [host functions](/docs/reference/host-functions/) document namespaces, signatures, and capability boundaries. Use [runtime controls](/docs/reference/runtime-controls/) for fuel, epoch interruption, recording, VMBC, JIT, WebAssembly, and `no_std` modes.

## Compatibility frontends

RustScript is the built-in `.rss` frontend. JavaScript and Lua use source-plugin crates and are compiled from an embedding application through `CompileSourceFileOptions` and its `with_source_plugin(...)` builder method.
