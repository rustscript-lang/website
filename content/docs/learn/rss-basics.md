# RSS basics

RSS is the RustScript source language. A program imports only the modules or host namespaces it uses, declares bindings and types, and evaluates expressions or calls host functions.

## Imports and host calls

`use` imports a module or host namespace. Host capabilities remain under the namespace supplied by the embedding runtime.

```rss
use bytes;
use re;
use runtime;

let regex_ok = re::match("(?i)^rustscript$", "RUSTSCRIPT");
let packet = b"pd\x01";
let packet_hex = bytes::to_hex(packet);
assert(bytes::from_hex(packet_hex) == packet);
let sleep_ok = runtime::sleep(100);
```

## Bindings, mutation, and types

Use `let` for a binding and `let mut` when the binding changes. A type annotation follows the binding name.

```rss
struct Stats {
    score: int
}

struct Profile {
    stats: Stats
}

let mut total = 0;
for i in 0..4 {
    total = total + i;
}
```

The declaration and loop forms are present in [`examples/example_complex.rss`](https://github.com/rustscript-lang/rustscript/blob/9a4509b162fe4500fe91180f3e2ea9d0230df304/examples/example_complex.rss#L10-L21).

## Blocks return their final expression

`if` and function blocks use their final expression as the result. A trailing semicolon changes an expression into a statement, so keep the result expression as the final item when a value is required.

```rss
let total = if !string::non_empty("rustscript") => {
    let zeroed = 0;
    zeroed
} else => {
    let bumped = total + 1;
    bumped
};
```

See the [RSS language reference](/docs/reference/rss/) for the complete accepted syntax and [host functions](/docs/reference/host-functions/) for the embedding contract.
