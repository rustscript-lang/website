# Run your first RSS program

RustScript compiles RSS source into compact bytecode and executes that bytecode in `pd-vm`. The source extension is `.rss`.

## Prerequisites

Install the Rust toolchain and clone the [RustScript repository](https://github.com/rustscript-lang/rustscript).

## Run an existing example

```bash
cargo run -p pd-vm --bin pd-vm-run -- --fuel 100000 examples/example_complex.rss
```

This command is derived from the RustScript README runner invocation. The displayed program fragment is from [`examples/example_complex.rss`](https://github.com/rustscript-lang/rustscript/blob/9a4509b162fe4500fe91180f3e2ea9d0230df304/examples/example_complex.rss#L18-L45) and was compiled to VMBC before publication.

```rss
let mut total = 0;
for i in 0..4 {
    total = total + i;
}

let base = 7;
let add = |value| value + base;
let base = 8;
let closure_value = add(5);

let profile: Profile = {stats: {score: closure_value}};
let matched = match profile?.stats?.score {
    None => 0,
    Some(score) => if score == 12 => { closure_value } else => { 0 },
    _ => 0,
};
```

## Continue

- [RSS basics](/docs/learn/rss-basics/) introduces imports, bindings, types, and host calls.
- [Embed `pd-vm`](/docs/learn/embed-pd-vm/) covers Rust integration.
- [RSS language reference](/docs/reference/rss/) is the complete syntax index.

## Source

RustScript README: `Overview`, `How To Use / Run Programs`, revision `9a4509b162fe4500fe91180f3e2ea9d0230df304`.
