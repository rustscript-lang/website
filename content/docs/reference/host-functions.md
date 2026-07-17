# Host functions

A host function is supplied by the embedding runtime. RSS imports a namespace and calls the registered members; the host controls which capabilities exist.

## Namespace boundary

```rss
use runtime;
let sleep_ok = runtime::sleep(100);
```

Source: [`examples/example_complex.rss`](https://github.com/rustscript-lang/rustscript/blob/9a4509b162fe4500fe91180f3e2ea9d0230df304/examples/example_complex.rss#L3-L8), [`examples/example_complex.rss`](https://github.com/rustscript-lang/rustscript/blob/9a4509b162fe4500fe91180f3e2ea9d0230df304/examples/example_complex.rss#L63-L66).

## Registration contract

The host declares the namespace, function name, argument schema, return schema, and execution behavior. RSS compilation records imports and validates syntax; the runtime binds and invokes the actual capability.

The following rules keep a script portable:

- Import only documented namespaces.
- Treat host-specific argument and return types as runtime API contracts.
- Keep privileged I/O, network, model, hardware, and UI work inside explicit host calls.
- Use the runtime-specific documentation for lifecycle and asynchronous behavior.

## Runtime-specific namespaces

| Runtime | Example namespaces |
|---|---|
| Core RustScript | `bytes`, `re`, `json`, `runtime` |
| pd-edge | `http`, `proxy`, transport and protocol namespaces |
| micro-rustscript | `gpio`, `i2c`, `mcu`, `serial`, `wifi`, `bluetooth` |
| IronRust | typed `System::...` imports |
| Flint | `flint::cli`, `flint::runtime`, `flint::llama`, `flint::tensor` and related namespaces |

## Sources

RustScript README `Internals / Host Calls and Callable Values`; pd-edge README `ABI Source of Truth`; micro-rustscript README `Framework API from RSS`; IronRust README `Compile VMBC To CLR`; Flint README `Host functions`.
