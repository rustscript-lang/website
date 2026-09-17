# Terminology

| Term | Meaning |
|---|---|
| RustScript | The language and VM/compiler project. |
| RSS | RustScript source code with the `.rss` extension. |
| `pd-vm` | The RustScript virtual machine and compiler crate. |
| VMBC | The portable bytecode artifact format. |
| Host function | A capability registered by an embedding runtime and called from RSS. |
| Host function descriptor | The generated schema, binding, adapter, resource types, and runtime-only effects for one `#[pd_host_function]`. |
| Host module descriptor | An explicit ordered list of host functions and extra resource declarations that installs as one catalog. |
| Host state | Per-VM or per-scope host-private state injected as a hidden parameter; it never appears in guest arity or catalog fingerprints. |
| Edge data plane | pd-edge runtime that handles traffic and executes edge programs. |
| Controller | pd-controller service that manages edges, programs, and debug sessions. |
| Function value | A first-class callable runtime value for a named function, builtin, host function, or closure; it can be passed, returned, selected, stored, and invoked. |
| Closure | A callable value that captures an enclosing environment using copy, borrow, mutable-borrow, or move semantics. |
| Call frame | The runtime state for one script invocation, including frame-relative locals, capture bindings, and a typed return continuation. |
| Callback | A typed host-facing handle for an exported or runtime callable; callbacks may run directly or through a queue and are tied to one program generation. |
| JIT | Just-in-time compilation for hot execution paths. |
| AOT | Ahead-of-time compilation of an artifact. |
| `no_std` | Rust environment without the standard library. |
| CLR | Common Language Runtime used by .NET. |
