<!-- docs-title: Internals -->

IronRust compiles RustScript bytecode into a CLR assembly and executes a generated `IPdVmProgram`. The WinForms path adds metadata-derived CLR bindings, object handles, a dedicated STA dispatcher, and an event queue.

## Components

| Component | Responsibility |
| --- | --- |
| `PdVm.Runner` | CLI entry point for source compilation, VMBC compilation, assembly loading, and execution. |
| `PdVm.Compiler.PdVmDotNetSourceCompiler` | Builds typed modules for reachable CLR imports and drives source-to-CLR compilation. |
| `PdVm.Compiler.PdVmNativeCompiler` | Calls the bundled native RustScript compiler and returns VMBC bytes. |
| `PdVm.Compiler.PdVmVmbcReader` | Decodes VMBC into `PdVmProgramModel`. |
| `PdVm.Compiler.PdVmStackAnalyzer` | Computes reachable operand-stack depths before IL emission. |
| `PdVm.Compiler.PdVmClrCompiler` | Emits and saves the generated CLR program assembly. |
| `PdVm.Runtime.PdVmProgramBase` | Stores resumable program state and implements shared host-call behavior. |
| `PdVm.Runtime.PdVmAssemblyLoader` | Loads the generated assembly and creates its concrete `IPdVmProgram`. |
| `PdVm.Runtime.PdVmExecution` | Drives `RunStep`, instruction budgets, yield, and asynchronous host completion. |
| `PdVm.Runtime.PdVmDotNetHost` | Decodes exact CLR binding descriptors, converts values, and invokes CLR members. |
| `PdVm.Runtime.PdVmWinFormsDispatcher` | Owns the WinForms STA thread and marshals UI work onto it. |
| `PdVm.Runtime.PdVmWinFormsEventLoop` | Converts WinForms events into RustScript action strings and tracks form state. |

## Source-to-assembly pipeline

`PdVmDotNetSourceCompiler.CompileFile` performs the following steps:

1. Resolve the entry source and source root, and reject an entry outside that root.
2. Recursively scan reachable RustScript modules for concrete `use System::...` imports.
3. Resolve imported CLR types from loaded/runtime assemblies and managed DLLs found in the source tree, Runner directory, or current working directory.
4. Reflect supported public constructors, methods, and instance properties from each imported type.
5. Copy the `.rss` source tree to a temporary overlay and write generated typed modules into reserved `System/.../*.rss` paths.
6. Call `PdVmNativeCompiler.CompileFile` on the overlay to obtain VMBC bytes.
7. Decode the bytes with `PdVmVmbcReader.ReadBytes` and replace synthetic generated imports with encoded CLR binding descriptors.
8. Call `PdVmClrCompiler.Compile` to emit the final assembly.
9. Copy `PdVm.Runtime.dll` and required external managed assemblies beside the program DLL.
10. Remove the temporary overlay unless `KeepTemporaryFiles` is enabled through the managed API.

The generated module has a declaration for a synthetic host import and a public wrapper with the name visible to RustScript. The synthetic name is based on the first 64 bits of a SHA-256 hash of the encoded binding descriptor.

## Metadata-derived CLR bindings

A binding descriptor records:

- CLR assembly full name
- module version ID (MVID)
- declaring type full name
- member kind and member name
- exact CLR parameter type identities
- exact CLR return type identity

At runtime, `PdVmDotNetHost.Call` decodes the descriptor, loads the named assembly, verifies its MVID, resolves the exact constructor, method, or property, converts arguments, and invokes that member. Typed interop is therefore metadata-precise dispatch; generated RustScript does not fall back to best-overload selection.

The compiler also emits a real CLR assembly reference for every imported CLR type. This keeps the generated assembly's metadata dependency explicit even though member dispatch passes through versioned descriptors.

The dynamic name-based host path is separate and disabled by default. `--enable-dynamic-dotnet` enables that experimental path for import names such as `System::Object::Call`; the typed WinForms example does not require it.

### Supported metadata shapes

The current metadata scanner exposes:

- public constructors on instantiable types
- public static and instance methods that are non-generic and are not special-name accessors
- public non-indexed instance property getters and setters
- a generated release function for supported reference types

Generic members, `out` parameters, pointers, by-reference types, and byref-like types are omitted.

Schema conversion is defined by `TryGetSchema`:

| CLR shape | RustScript schema |
| --- | --- |
| `void` | `null` |
| `string`, `char`, enum | `string` |
| `bool` | `bool` |
| `byte[]` | `bytes` |
| `float`, `double`, `decimal` | `float` |
| supported one-dimensional array | `[element]` |
| integral values and reference objects | `int` |

For reference objects, the `int` is an IronRust handle rather than a CLR address.

## Generated CLR program

`PdVmClrCompiler` first runs `PdVmStackAnalyzer.Analyze`, then uses `PersistedAssemblyBuilder` and `System.Reflection.Emit` to create a public sealed type derived from `PdVmProgramBase`.

The assembly contains:

- static `PdVmValue[]` constants
- static `PdVmHostImport[]` imports
- one shared runtime local-value array
- a generated `RunStep(IPdVmHost, int)` method

The VMBC instruction stream is decoded during compilation and is not embedded as an interpreter loop. Reachable VMBC offsets become CLR labels. Backward jumps become CLR branches inside the generated method.

When type-map information is available, integer, float, boolean, and string arithmetic or comparison can lower to CLR opcodes. Supported builtins can become direct calls to focused `PdVmBuiltins` methods. Dynamic operations use `PdVmOps`.

The operand stack normally lives in generated CLR locals. IronRust materializes it into `PdVmProgramBase` state at host-call, halt, yield/wait, resume, and instruction-budget boundaries so execution can return and later continue at the stored instruction pointer.

## Loading and execution

For a saved DLL, `PdVmAssemblyLoader.LoadProgram` registers the output directory for dependency resolution, loads the assembly, finds a non-abstract parameterless type implementing `IPdVmProgram`, and creates it.

For direct `.rss` execution, the Runner compiles to a temporary DLL and calls `PdVmAssemblyLoader.CreateProgram` on an in-memory assembly. Both paths then create the console host, register `PdVmDotNetHost.Call` as fallback host dispatch, and call `PdVmExecution.RunAsync`.

`PdVmExecution.RunAsync` repeatedly calls `RunStep` until the program halts. A waiting status is completed through `IAsyncPdVmHost.WaitAsync`, then passed back with `ResumePending`. `--max-steps` supplies the total instruction limit, while checks inside generated CLR code enforce the remaining budget during a single `RunStep` call.

## CLR values and object handles

`PdVmDotNetHost` converts scalar CLR results directly to `PdVmValue`. Other CLR objects receive monotonically increasing integer handles kept in two maps:

- handle to object
- object identity to existing handle

Returning the same CLR object reuses its handle. Generated instance calls pass the handle first; `PdVmDotNetHost` resolves it and verifies that the object is assignable to the descriptor's declaring type.

A generated release call removes both mappings. If the CLR object implements `IDisposable`, release also calls `Dispose`.

## WinForms threading and events

`PdVmWinFormsDispatcher` starts one background thread named `PdVm WinForms UI`, sets it to STA, initializes per-monitor-v2 DPI awareness and WinForms visual styles, creates a hidden `Form` as an invoker, and enters `Application.Run()`.

UI-bound exact calls are sent to that thread with `BeginInvoke`. `PdVmDotNetHost.RequiresWinFormsDispatcher` dispatches members from the `System.Windows.Forms` assembly and most `PdVmWinFormsEventLoop` methods there. `Wait` and `WaitTimeout` are deliberately excluded because they block while waiting for queued work.

`PdVmWinFormsEventLoop` stores one `FormState` per form in a `ConditionalWeakTable`. Each state contains:

- `ConcurrentQueue<QueuedEvent>` for action strings and optional pointer snapshots
- `AutoResetEvent` to wake `Wait` or `WaitTimeout`
- the close-permission flag
- the most recently dequeued pointer snapshot

A click or pointer event runs on the UI thread, enqueues a small record, and signals the waiter. The RustScript VM waits on its execution thread, so the WinForms message loop remains available.

`BindClosing` installs a delegate matching the form's `FormClosing` event. Before an explicit close is allowed, the handler sets the event argument's `Cancel` property and queues the configured action. `Close` sets `AllowClose`, then invokes the form's `Close` method on the dispatcher thread.

This division keeps window creation and application behavior in `examples/dotnet-typed-winforms.rss`; the C# event adapter only provides thread marshalling, action delivery, dialog invocation, pointer snapshots, and close coordination.
