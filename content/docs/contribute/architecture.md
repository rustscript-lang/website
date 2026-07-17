# System architecture

RustScript is the language and VM/compiler core. pd-edge runs programs in the edge data plane. pd-controller manages edge state, program deployment, remote debugging, and Web UI workflows. micro-rustscript packages VMBC for embedded targets. IronRust compiles VMBC to CLR assemblies. Flint binds inference backends as RustScript host functions.

## User and implementation boundaries

| Area | User-facing boundary | Implementation focus |
|---|---|---|
| RustScript | RSS, `pd-vm`, VMBC, debugger | parser, compiler, VM, JIT, artifacts |
| pd-edge | proxy, console, admin API | data-plane runtime, protocol DAGs, host ABI |
| pd-controller | deployment, status, debug UI | RPC, persistence, session orchestration |
| micro-rustscript | flashable images and VMBC updates | target integration, partition loading, interpreter bridge |
| IronRust | source/VMBC to CLR | CLR runtime, compiler, generated typed modules |
| Flint | inference workflows in RSS | native resource handles and inference host functions |

Read a user guide before changing its implementation counterpart. User documentation describes observable behavior and supported commands. Contributor documentation describes repository boundaries and maintenance responsibilities.
