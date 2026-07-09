# JIT, AOT, and Why We Lower to SSA

*Compilation tiers in pd-vm and the role Cranelift plays*

---

## Recap: The Interpreter Baseline

pd-vm starts with a compact stack-bytecode interpreter. That baseline matters because proxy scripts need very low startup overhead, predictable suspension, and small execution state.

For short-lived request handlers, the interpreter is often enough. But hot loops and stable long-lived programs benefit from native execution. That is where the trace JIT and AOT tiers enter.

## The Three Tiers

```text
Bytecode
  -> Interpreter
  -> Trace JIT
     record -> SsaTrace -> Cranelift -> native trace
  -> Whole-program AOT
     CFG -> AotInstruction -> AotSsaProgram -> Cranelift -> native program
```

| | Interpreter | Trace JIT | Whole-program AOT |
|---|---|---|---|
| **Compilation unit** | None | Hot loop traces | Entire program |
| **Warm-up** | Zero | After repeated execution | One compile before execution |
| **Internal IR** | Bytecode | `SsaTrace` | `AotSsaProgram` |
| **Suspension model** | Native to the VM | Exit back to VM state | Re-enter through VM-aware checkpoints |

## Why Not Use SSA in the Interpreter?

SSA is excellent for optimization, but it is the wrong baseline runtime representation here.

**1. It expands the working representation.**  
Stack bytecode is compact because operand flow is implicit. SSA makes that flow explicit, which is valuable for optimization but more expensive to carry in the baseline interpreter.

**2. It complicates control-flow joins.**  
SSA needs block parameters or phi resolution. A stack machine can keep the continuation model much smaller and simpler.

**3. It does not help suspension.**  
The interpreter must pause and resume around host calls, fuel, and epoch deadlines. Stack plus locals is already a compact continuation format. An SSA register file is not.

**4. It solves the wrong problem at this tier.**  
The interpreter's job is quick startup, correctness, and simple embedding. SSA becomes useful only once the runtime has decided to optimize.

## Why Lower to SSA for Native Code?

Once the target becomes native code, the trade changes.

**1. Native codegen needs explicit data flow.**  
Stack effects hide producer-consumer relationships. SSA reconstructs them in a form the backend can optimize.

**2. Type specialization becomes practical.**  
The interpreter can branch on runtime tags. Native code wants more explicit value categories so it can choose direct arithmetic and comparison paths.

**3. Cranelift already works in SSA terms.**  
Lowering through SSA gives pd-vm a cleaner bridge into the backend rather than asking Cranelift to recover structure from a stack VM directly.

**4. Optimization is much easier over SSA.**  
Constant folding, dead-code elimination, and value forwarding are natural in SSA and much less natural over raw stack state.

## The Two SSA Pipelines

### Trace JIT: `SsaTrace`

The trace JIT records a hot linear path and lowers that path into `SsaTrace`. Guards keep the trace honest. If the observed assumptions stop holding, execution exits back to the interpreter.

This is a targeted optimization tier: specialize the hot path without forcing the whole program through a full ahead-of-time pipeline.

### Whole-program AOT: `AotSsaProgram`

The AOT path lowers the entire program into control-flow blocks, then into typed SSA form. That creates a native artifact that can run without interpreter participation on the hot path while still preserving VM-aware resume points for host calls and yields.

The important difference from trace JIT is scope. AOT is whole-program and planned; trace JIT is local and profile-driven.

## Why Cranelift?

Cranelift is a pragmatic backend choice for this project.

**1. Compile speed matters.**  
pd-vm needs a backend that is compatible with fast trace compilation and practical ahead-of-time generation.

**2. The Rust integration is straightforward.**  
Cranelift fits a Rust-native codebase without pulling in a large C++ toolchain or a custom backend effort.

**3. The optimization level is good enough for the workload.**  
Proxy scripts spend much of their time in control flow, string handling, and host interaction. For that profile, fast compile time and operational simplicity matter more than chasing the most aggressive optimizer possible.

## Where This Falls Short

- **Cranelift is not the most aggressive optimizer available.** Some compute-heavy workloads would benefit from a stronger backend.
- **Trace JIT only helps where the runtime has observed heat.** Cold and irregular paths remain interpreted unless AOT is used.
- **AOT still pays for dynamic uncertainty.** When type information is incomplete, native code must preserve generic value handling.
- **The tiers are complementary, not deeply profile-coupled.** The runtime does not yet feed trace observations back into a richer global recompilation pipeline.

## Summary

SSA is not the baseline runtime format in pd-vm. It is the optimization bridge from compact, suspendable bytecode to native code. The interpreter stays small and cheap; the JIT and AOT tiers reconstruct the explicit data flow they need only when native execution is worth it.

## Related

- [Why pd-vm Uses a Stack + Local-Slots Architecture](./v01-why-stack-and-local-slots.md)
- [Async Suspension Without Coroutines](./v05-async-suspension.md)
- [Host Function ABI](./v06-host-function-abi.md)
