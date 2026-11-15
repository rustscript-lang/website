<!-- docs-title: Functions, Generics, and Recursion -->

Functions are predeclared, so forward calls, direct recursion, mutual recursion, nested declarations, exports, generic parameters, and callable references are available.

## Function declarations

A block-bodied function ends with its result expression.

```rss
fn add(left: int, right: int) -> int {
    left + right
}
add(20, 22);
```

## Expression-bodied functions

`fn name(...) = expression;` is the compact form.

```rss
fn square(value: int) -> int = value * value;
square(6);
```

## Parameters and return schemas

Parameters use `name: Schema`; a result schema follows `->`. A function with no `->` clause has the Unit return type `()`, and `-> ()` states that type explicitly.

```rss
fn describe(name: string, score: int) -> [string, int] {
    [name, score]
}
let row: [string, int] = describe("Ada", 42);
row[0].length + row[1];
```

## Unit results and Unit callables

A Unit-returning function still has a value: calling it produces `()`, which can be bound, passed, and returned like any other value. A callable schema spells that contract as `fn() -> ()`.

```rss
fn tick() {}

fn apply_times(step: fn() -> (), times: int) -> () {
    let mut done = 0;
    while done < times {
        step();
        done += 1;
    }
    ()
}

let completed: () = apply_times(tick, 3);
completed;
```

Unit is a distinct logical type even though the VM carries it in its internal Null slot, so a Unit result is not "no value" and is not `None`. Use `Option<T>` when a call may legitimately have nothing to return.

## Public functions

`pub fn` exports a function from a source module.

```rss
pub fn answer() -> int {
    42
}
answer();
```

## External function declarations

A semicolon-only function declaration describes a host function supplied by the embedding runtime.

```rss
fn host_log(message: string);
host_log("ready");
```

## Forward calls

A function can call another function declared later in the source.

```rss
fn first(value: int) -> int {
    second(value) + 1
}
fn second(value: int) -> int {
    value * 2
}
first(20);
```

## Direct recursion

Recursive functions use ordinary named calls and the configured script call-depth limit.

```rss
fn factorial(value: int) -> int {
    if value <= 1 => {
        1
    } else => {
        value * factorial(value - 1)
    }
}
factorial(5);
```

## Mutual recursion

Predeclaration also permits mutually recursive functions.

```rss
fn is_even(value: int) -> bool {
    if value == 0 => { true } else => { is_odd(value - 1) }
}
fn is_odd(value: int) -> bool {
    if value == 0 => { false } else => { is_even(value - 1) }
}
is_even(10);
```

## Nested functions

Functions may be declared inside function bodies and can capture outer locals.

```rss
fn make_offset(base: int) {
    fn add(value: int) -> int {
        value + base
    }
    add
}
let add_two = make_offset(2);
add_two(40);
```

## Generic functions

Angle brackets declare generic type parameters.

```rss
fn identity<T>(value: T) -> T {
    value
}
let number = identity::<int>(42);
let text = identity::<string>("rss");
```

## Explicit type arguments

Turbofish syntax `::<...>` supplies explicit type arguments at a named call or function reference.

```rss
fn identity<T>(value: T) -> T {
    value
}
let answer = identity::<int>(42);
let int_identity = identity::<int>;
int_identity(answer);
```

## Higher-order generics

Callable schemas can contain generic parameters.

```rss
fn identity<T>(value: T) -> T {
    value
}
fn apply<T>(mapper: fn(T) -> T, value: T) -> T {
    mapper(value)
}
apply::<int>(identity, 42);
```
