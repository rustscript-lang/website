# Host Function ABI: Bridging the VM and the Proxy Runtime

*How pd-vm binds scripts to host capabilities, and what this means for versioning in hybrid deployments*

---

## The Bridge

pd-vm scripts do not perform I/O directly. They call named host functions provided by the embedding runtime. Reading a request header, configuring an upstream exchange, or initiating transport work all cross this boundary.

That boundary is the host function ABI.

## How Host Functions Are Declared

At compile time, a program records the host imports it expects:

```rust
struct HostImport {
    name: String,
    arity: u8,
    return_type: ValueType,
}
```

The `Call` instruction points at the program's import table, not directly at a host registry slot. That indirection is what allows late binding.

## How Host Functions Are Registered

The embedding runtime populates a `HostFunctionRegistry` with available functions. The registry supports both stateless registrations and per-VM factories, plus variants that consume arguments directly from the VM stack slice.

That split matters because some host functions are pure dispatch helpers while others need per-VM or per-request state.

## The Binding Plan

When a program is bound, the registry builds a `HostBindingPlan`: a precomputed mapping from the program's imports to concrete host function slots.

That gives the runtime two useful properties:

- **early failure** if an import is missing
- **amortized binding cost** when the same import signature appears repeatedly

At runtime, `Call` can then use resolved indices rather than repeated name-based lookup.

## Builtins and Host Imports

pd-vm also ships with builtins that live inside the VM itself. These bypass host binding and execute through the builtin dispatch path.

The important distinction is operational:

- **builtins** are part of the VM contract
- **host imports** are part of the embedding contract

That separation keeps core VM behavior small while letting `pd-edge` expose a much larger runtime surface through imports.

## Benefits of the Design

### 1. Decoupled evolution

Programs and hosts can evolve independently as long as the required imports still exist with compatible calling shape.

### 2. Testability

Host behavior can be replaced or wrapped at the registry layer without changing the script.

### 3. Fast call setup

Binding resolves names ahead of time, and stack-slice argument variants avoid unnecessary call-path allocation.

### 4. Clear operational compatibility

The import list is an explicit compatibility surface. Operators can reason about whether a given node can host a given program.

## Challenges in Hybrid Deployments

In mixed-version fleets, compatibility is not theoretical. It is operational.

### Import mismatch

If a program imports a host function that an older node does not expose, binding fails early with an unbound import error.

### Arity changes

If a host function changes its argument count, binding fails because name and arity are part of the current bind-time contract.

### Return type expectations

Return types still matter, but current bind-time compatibility is primarily name-and-arity based. That means return-type changes should still be treated as breaking API changes even if the bind step itself does not reject them in every case.

### Builtin drift

Builtins are part of the VM-side bytecode contract rather than the host registry. Changes there must stay coordinated with the bytecode format version the loader accepts.

## A Practical Forward-Compatibility Strategy

For hybrid deployments, the safer pattern is:

1. **Compile against the minimum supported runtime surface.**
2. **Use import manifests as compatibility data.** Compare a program's imports against a node's exposed registry before deployment.
3. **Upgrade nodes before depending on new imports.**
4. **Treat name, arity, and effective return behavior as stable API surface.** New behavior should prefer new import names or clearly versioned namespaces.

This keeps compatibility decisions explicit and operational, rather than relying on scripts to probe for capabilities at runtime.

## The ABI Boundary Across Execution Tiers

The host ABI remains the same whether the program runs in the interpreter, exits from a trace, or executes through AOT-generated code. That uniformity is important because the embedding runtime should not have to care which execution tier is active.

## Summary

The host function ABI is the main contract between pd-vm and `pd-edge`: imports on the program side, registry entries on the host side, and a binding plan in the middle. The design favors early validation, reusable binding work, and a compatibility surface that operators can reason about directly.

## Related

- [Async Suspension Without Coroutines](./v05-async-suspension.md)
- [Why pd-vm Uses a Stack + Local-Slots Architecture](./v01-why-stack-and-local-slots.md)
- [The Protocol DAG](./e01-protocol-dag-and-session-reuse.md)
