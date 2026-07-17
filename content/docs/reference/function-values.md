# Function values

Function values are an active RustScript development feature. The current test suite verifies direct use of named functions as values, explicit generic specialization, higher-order parameters, returned functions, escaping closures, mutable capture state, aliasing, and independent factory evaluations.

## Generic function values

```rss
fn identity<T>(value: T) -> T { value }
let int_identity = identity::<int>;
int_identity(42);
```

Source: [`tests/compiler/compiler_rustscript_tests.rs`](https://github.com/rustscript-lang/rustscript/blob/9a4509b162fe4500fe91180f3e2ea9d0230df304/tests/compiler/compiler_rustscript_tests.rs#L2280-L2284).

## Returned functions and escaping closures

```rss
fn make_adder(delta: int) {
    |value| value + delta;
}
let add_one = make_adder(1);
add_one(41);
```

Source: [`tests/compiler/compiler_rustscript_tests.rs`](https://github.com/rustscript-lang/rustscript/blob/9a4509b162fe4500fe91180f3e2ea9d0230df304/tests/compiler/compiler_rustscript_tests.rs#L2316-L2324).

## Mutable capture identity

Aliases share one captured environment, while separate factory evaluations create independent environments.

```rss
fn make_counter() {
    let mut count = 0;
    fn next() {
        count = count + 1;
        count
    }
    next
}
let first = make_counter();
let alias = first;
let second = make_counter();
first();
alias();
second();
```

Source: [`tests/compiler/compiler_rustscript_tests.rs`](https://github.com/rustscript-lang/rustscript/blob/9a4509b162fe4500fe91180f3e2ea9d0230df304/tests/compiler/compiler_rustscript_tests.rs#L2335-L2350).

## Status and compatibility

These behaviors are verified on the current development branch. The public release contract has not yet fixed VMBC compatibility, AOT/JIT coverage, no-std parity, Rust embedding behavior, stale-handle behavior, or host-retained callback lifetime. Code using function values should therefore stay pinned to a tested RustScript revision.

## Source

RustScript README `TODO` and the current compiler runtime tests at revision `9a4509b162fe4500fe91180f3e2ea9d0230df304`.
