# Why We Didn't Choose a Functional Language

*What functional languages offer an embedded proxy VM, and how pd-vm covers many of the same needs without making the runtime itself functional*

---

pd-vm is embedded inside a proxy runtime. That changes the decision. The main pressure is not language purity or elegance. It is explicit host effects, compact continuation state, predictable teardown, and straightforward integration with `pd-edge`.

Functional languages still solve several real problems well. The question is not whether those benefits matter. The question is whether the runtime itself should be built around that model.

## What a Functional Language Would Improve

### 1. Immutability by default

Immutable values reduce aliasing problems and make concurrency easier to reason about.

### 2. Purity as a semantic boundary

Pure code is easier to cache, replay, and test because its behavior depends only on inputs.

### 3. Persistent data structures

Structural sharing makes snapshots and forks cheaper when the runtime wants to preserve old state while creating new state.

### 4. A more uniform high-level model

Closures, expression-oriented control flow, and algebraic-style data handling can make some compiler and language designs feel more coherent.

## Why We Did Not Choose It

### The runtime is embedded, not standalone

The dominant boundary in this system is the host boundary. Network I/O, transport state, request state, and scheduling all live outside the VM. A functional runtime would not remove that boundary. It would mostly wrap it in a different programming model.

### Multiple frontends still need a neutral target

pd-vm serves multiple source languages. Making the runtime itself language-shaped in a functional direction would force every frontend through one more semantic translation step before it could even reach execution.

### GC and persistent-runtime assumptions are a poor fit here

Proxy scripts are short-lived, request-scoped, and latency-sensitive. A runtime centered on persistent structures and language-level heap management pushes complexity into exactly the part of the system that needs to stay operationally simple.

### Debugging and suspension should stay direct

For this VM, it is useful that execution state is visible as instruction pointer, locals, and stack. That model maps cleanly onto suspension, replay, and debugging in a proxy environment.

## How pd-vm and pd-edge Cover the Same Needs

### Immutability pressure becomes controlled sharing

Heap-backed values are shared cheaply and become privately owned only when mutation needs ownership. That keeps aliasing manageable without turning the whole runtime into a persistent functional heap.

### Purity pressure becomes an explicit host boundary

The meaningful side effects in this system already cross a clear line: host calls. Proxy state, I/O, and protocol transitions are owned by `pd-edge`, not hidden inside the VM. That makes effectful behavior operationally visible even without a functional effect system.

### Snapshot pressure becomes cheap reset and reuse

Instead of relying on persistent language-level data structures, the runtime keeps VM instances cheap to reset and reuse. Shared program artifacts stay loaded, while request-local execution state is rebuilt or reset per request.

### Functional-style branching is covered where it matters

The compiler IR already includes optional-value and match-oriented forms. That gives the frontend a direct way to express common proxy logic such as missing metadata, variant handling, and branch-heavy routing without requiring a fully functional runtime model.

### Operational simplicity stays in the foreground

The current design keeps suspension, pooling, replay, and debugging aligned with the VM's concrete state model. That is a major advantage in an embedded proxy runtime, where observability and control matter as much as source-language style.

## Where This Still Falls Short

- **Higher-order composition is narrower.** The runtime is more conservative about first-class callable behavior than a fully functional language would be.
- **The data model is not a full functional type model.** Optional and match forms exist, but the runtime does not expose a broad algebraic data type system.
- **The ownership discipline is practical, not formal.** pd-vm gets useful constraints from the compiler and runtime structure, but not the stronger semantic guarantees of a pure functional language.
- **Structural sharing is limited.** Shared values are cheap to clone, but they are not persistent collections in the functional-language sense.

## Conclusion

We did not reject functional languages because their benefits were irrelevant. We rejected them because an embedded proxy VM has a different center of gravity. The runtime needs clear host boundaries, compact continuation state, GC-free teardown, and low-friction embedding inside `pd-edge`.

The result is less language-idealized than a functional runtime. It is also a better fit for the operational shape of this system.

## Related

- [Why pd-vm Uses a Stack + Local-Slots Architecture](./v01-why-stack-and-local-slots.md)
- [GC-Free Scripting](./v04-gc-free-memory.md)
- [Async Suspension Without Coroutines](./v05-async-suspension.md)
- [The Protocol DAG](./e01-protocol-dag-and-session-reuse.md)
