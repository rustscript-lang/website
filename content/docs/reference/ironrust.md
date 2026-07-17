# IronRust reference

## Components

IronRust contains the CLR value/runtime layer, VMBC-to-CLR compiler, runner, test projects, and the minimal `PdEdge.Http` proxy. `PdVm.Compiler` emits CLR assemblies from VMBC; `PdVm.Runner` provides source, VMBC, and assembly workflows.

## Build and test

IronRust requires the .NET 10 SDK. The solution build and test steps cover the runtime, compiler, runner, and proxy projects. Release packages contain the managed components and the native compiler support required by the runner.

## Compilation and typed CLR imports

The compiler accepts RustScript source through the native compiler path and compiles VMBC into CLR. Reachable `use System::...` declarations drive typed wrapper generation for supported public CLR members. Dynamic reflection is opt-in. Generated assemblies use the CLR runtime ABI and do not carry the original VMBC instruction stream.

## Proxy and benchmark scope

`PdEdge.Http` is a minimal CLR HTTP proxy rather than a replacement for the pd-edge transport stack. The repository describes how to exercise the existing Rust benchmark harness against that proxy.

## Source

IronRust README: `Projects`, `Requirements`, `Build`, `Test`, `Compile Source To VMBC`, `Compile VMBC To CLR`, `Release packages`, `Run The Minimal HTTP Proxy`, `PdEdge.Http Scope`, `Benchmark With The Existing Rust Harness`, and `Current Status`, revision `fce4aa41931135ccf5fdb73c7270ec0baf1a13ef`.
