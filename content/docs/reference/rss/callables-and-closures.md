<!-- docs-title: Callables and Closures -->

Named functions, builtins, and closures are first-class callable values. They can be annotated, passed, returned, selected by control flow, and stored in arrays or maps.

## Callable schemas

A callable schema uses `fn(ParamTypes...) -> ResultType`.

```rss
fn add_one(value: int) -> int {
    value + 1
}
let operation: fn(int) -> int = add_one;
operation(41);
```

## Named function values

Referencing a function without `()` creates a callable value.

```rss
fn double(value: int) -> int {
    value * 2
}
let operation = double;
operation(21);
```

## Builtin function values

Builtins can also be captured and called as values.

```rss
let measure: fn(string) -> int = len;
measure("RustScript");
```

## Higher-order functions

Callable values can be passed as parameters.

```rss
fn apply_twice(mapper: fn(int) -> int, value: int) -> int {
    mapper(mapper(value))
}
fn add_one(value: int) -> int {
    value + 1
}
apply_twice(add_one, 40);
```

## Returned callables

Functions can return named functions or closures.

```rss
fn add_one(value: int) -> int {
    value + 1
}
fn select() -> fn(int) -> int {
    add_one
}
let operation = select();
operation(41);
```

## Callable arrays and maps

Collections can store callables and return them through indexing or field access.

```rss
fn add_one(value: int) -> int { value + 1 }
fn add_two(value: int) -> int { value + 2 }
let operations = [add_one, add_two];
let named = {primary: add_one};
let from_array = operations[1];
let from_map = named.primary;
from_array(40) + from_map(0);
```

## Closures

A closure uses pipe-delimited parameters followed by an expression or expression block.

```rss
let base = 40;
let add = |value| value + base;
add(2);
```

## Zero-parameter closures

`|| expression` declares a closure without parameters.

```rss
let value = 42;
let read = || value;
read();
```

## Escaping closures

A returned closure retains its captured environment after the defining function returns.

```rss
fn make_adder(delta: int) -> fn(int) -> int {
    |value| value + delta
}
let add_one = make_adder(1);
add_one(41);
```

## Shared mutable capture state

Aliases of one closure share its environment; separate factory evaluations allocate independent environments.

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
[first(), alias(), second()];
```

## Borrowed captures

A borrow capture observes the shared outer cell instead of taking an owned snapshot.

```rss
let mut base = 1;
let read = || &base;
base = 2;
[read(), base];
```

## Generic function values

A callable annotation or explicit turbofish resolves a generic function value.

```rss
fn identity<T>(value: T) -> T {
    value
}
let int_identity: fn(int) -> int = identity;
let string_identity = identity::<string>;
int_identity(42);
string_identity("rss");
```

## Callable selection and equality

Compatible callable schemas merge through `if` and `match`. Equality follows function-item and closure-environment identity.

```rss
fn add_one(value: int) -> int { value + 1 }
fn add_two(value: int) -> int { value + 2 }
let selected = if true => { add_one } else => { add_two };
let first = |value| value + 1;
let second = |value| value + 1;
[selected(40), add_one == add_one, first == first, first == second];
```
