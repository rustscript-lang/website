# Terminology

| Term | Meaning |
|---|---|
| RustScript | The language and VM/compiler project. |
| RSS | RustScript source code with the `.rss` extension. |
| `pd-vm` | The RustScript virtual machine and compiler crate. |
| VMBC | The portable bytecode artifact format. |
| Host function | A capability registered by an embedding runtime and called from RSS. |
| Edge data plane | pd-edge runtime that handles traffic and executes edge programs. |
| Controller | pd-controller service that manages edges, programs, and debug sessions. |
| Function value | A callable represented as a runtime value; currently under active development. |
| Closure | A callable expression that can capture an enclosing environment. |
| JIT | Just-in-time compilation for hot execution paths. |
| AOT | Ahead-of-time compilation of an artifact. |
| `no_std` | Rust environment without the standard library. |
| CLR | Common Language Runtime used by .NET. |
