# Documentation sources

The documentation uses the following top-level README revisions for prose facts:

| Repository | Revision | README scope |
|---|---|---|
| `rustscript` | `9a4509b162fe4500fe91180f3e2ea9d0230df304` | language, `pd-vm`, artifacts, runtime controls, VM/compiler internals |
| `pd-edge` | `91e953a43a896febd681cc19a6c55ccb1cbf9230` | edge runtime, binaries, deployment, protocol DAGs, ABI |
| `pd-controller` | `a8ac5405db30822199d6ccfff44afebf14d27602` | control plane, RPC, service operations, Web UI |
| `micro-rustscript` | `a874646f2094c2cf2ede008e404785b1516b5a9e` | embedded targets, flash, framework API, VMBC loading |
| `IronRust` | `fce4aa41931135ccf5fdb73c7270ec0baf1a13ef` | CLR runtime, VMBC compilation, typed CLR imports |
| `flint` | `458990bc4cfadca964be7992edf9e9c0fa6aba2c` | inference runtime, CLI, RSS host functions |

The machine-readable [source map](https://github.com/rustscript-lang/website/tree/main/content/docs/_meta/source-map.json) records the README headings that feed each documentation page. RSS syntax and code samples additionally use parser, test, and source-file evidence at the recorded RustScript revision.
