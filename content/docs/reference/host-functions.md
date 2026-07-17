# Host functions

A host function is supplied by the embedding runtime. RSS imports a namespace and calls the registered members; the host controls which capabilities exist.

## Namespace boundary

```rss
use runtime;
let sleep_ok = runtime::sleep(100);
```

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
