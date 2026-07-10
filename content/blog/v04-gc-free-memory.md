# GC-Free Scripting: How pd-vm Manages Memory Without a Garbage Collector

*Ownership semantics, shared heap values, and compiler-driven lifetime control in a dynamic VM*

---

## The Usual Answer: Garbage Collection

Most scripting VMs use a collector because it simplifies the language model. For a general-purpose language, that is often the right trade.

For pd-vm, it is not. Proxy scripts are short-lived, request-scoped, and latency-sensitive. The runtime wants deterministic teardown more than it wants a fully general tracing heap.

## The Value Model

pd-vm keeps primitives inline and stores heap-backed values behind shared ownership:

```rust
enum Value {
    Null,
    Int(i64),
    Float(f64),
    Bool(bool),
    String(Arc<String>),
    Bytes(Arc<Vec<u8>>),
    Array(Arc<Vec<Value>>),
    Map(Arc<VmMap>),
}
```

That gives the runtime three useful properties:

- **Cheap clones** for heap values.
- **Deterministic release** when the last owner goes away.
- **No tracing pass** before memory can be reclaimed.

## How `ldloc` and `stloc` Work

`ldloc` is non-destructive. It reads a local slot and places a clone of the value on the stack. For heap-backed values, that means another shared owner rather than a deep copy.

`stloc` overwrites a slot with the top-of-stack value. The previous slot value is then dropped in the normal way. Nothing special is needed from the runtime beyond ordinary ownership transitions.

This keeps the interpreter small while still letting the compiler control how long shared references survive.

## Explicit Move Through Existing Opcodes

pd-vm does not need a dedicated move opcode. When the compiler knows a local is dead after a read, it emits the `ldloc; ldc Null; stloc` pattern to read the value and clear the slot early.

That matters because it gives the compiler precise lifetime control without widening the instruction set or adding GC machinery.

## Mutation Without a Collector

When a script mutates a heap-backed value, the runtime first ensures it has owned access to that payload. If the value is still shared, the payload is cloned before mutation proceeds. If it is already uniquely owned, the update can proceed directly.

The result is value-like behavior from the script's perspective:

- sharing is cheap when values are only being read
- mutation does not leak across aliases
- ownership stays explicit in the runtime model

## Closure Captures Stay Simple

Closures capture values into stable storage rather than relying on heap-managed environment graphs. That avoids a large class of runtime complexity around mutable cells, dangling references, and collector-visible captured environments.

The compiler does more work here so the VM can do less.

## Program Sharing and VM Reuse

Not everything is request-local. Compiled program state is shared, while execution state is small and resettable.

```rust
let mut vm = Vm::new_shared(program.clone());
registry.bind_vm_cached(&mut vm)?;
```

That gives the embedding runtime a practical model:

- the program stays shared
- host binding plans can be reused
- the VM instance can be reset for the next request

In `pd-edge`, that is often more valuable than building a large persistent language heap.

## Teardown Is Just Normal Drop

When a request completes, the VM can clear or drop its stack and locals. Shared values release their backing storage when the last owner disappears. There is no separate mark phase, sweep phase, or finalizer queue.

That keeps teardown proportional to the amount of live state rather than to the size of an abstract heap graph.

## Where This Falls Short

- **Large collection copies are still real work.** Shared ownership makes clones cheap until mutation needs ownership.
- **The compiler carries more responsibility.** Liveness and availability matter because the VM is intentionally simple.
- **This is not a general persistent-data-structure model.** It is a pragmatic ownership model for an embedded runtime.

For request-scoped proxy scripts, that trade is favorable: no GC pauses, predictable cleanup, and a memory model that matches short-lived embedded execution.

## Related

- [Why pd-vm Uses a Stack + Local-Slots Architecture](./v01-why-stack-and-local-slots.md)
- [Why We Didn't Choose a Functional Language](./v03-why-not-functional.md)
- [Async Suspension Without Coroutines](./v05-async-suspension.md)
