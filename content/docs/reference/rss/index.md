# Syntax Cheatsheet

This reference describes the RustScript frontend accepted by the current `pd-vm` parser. It distinguishes implemented RSS syntax from compatibility-language syntax and from function values that are still under development.

## API reference

- [Builtins](./builtins/) documents compiler and VM functions, including global calls and builtin namespaces.
- [Stdlibs](./stdlibs/) documents every public function in the bundled pure-RustScript modules.

## Source files, comments, and terminators

RSS source files use the `.rss` extension. Line comments start with `//`. Statements end with `;`. Blocks use `{` and `}`. The final expression in a function or expression block supplies that block's value; adding a trailing semicolon makes it a statement.

## Lexical structure

The lexer recognizes identifiers, integer literals, floating-point literals, strings, byte strings, booleans, and `null`.

| Form | Meaning |
|---|---|
| `name`, `_name`, `TypeName` | Identifiers |
| `42`, `1_000`, `-7` | Integer values |
| `0.5`, `1.0e3` | Floating-point values |
| `"text"` | String values with escapes |
| `b"bytes"` | Byte-string values |
| `true`, `false` | Boolean values |
| `null` | Null value |

Keywords include `pub`, `use`, `as`, `fn`, `struct`, `let`, `mut`, `for`, `if`, `else`, `match`, `while`, `break`, `continue`, and `return`.

## Modules and imports

RSS uses `use`, not `import`, for RustScript modules and host namespaces.

```rss
use super::stdlib::rss::strings as string;
use bytes;
```

A namespace form uses `use namespace;`; aliases use `use namespace as local_name;`; named imports use `use namespace::{member, member as local_name};`; wildcard imports use `use namespace::*;`.

Source modules support `self`, `super`, aliases, named imports, and wildcard imports. Built-in host namespaces require namespace calls and reject list imports where the host ABI does not expose them.

## Bindings, mutation, and types

Use `let` for a binding and `let mut` for a binding that is assigned after initialization.

```rss
let mut total = 0;
for i in 0..4 {
    total = total + i;
}
```

A binding can use a type annotation:

```rss
let profile: Profile = {stats: {score: closure_value}};
```

Implemented type syntax includes primitive schemas such as `int`, `float`, `bool`, `string`, and `bytes`; named struct schemas; collection schemas; generic arguments; and callable-related schemas where supported by the current compiler. Type inference supplies metadata for unannotated bindings.

Borrow expressions use `&value` and `&mut value`. A mutable borrow requires a mutable local, field, or index target.

## Structs and object values

Declare a struct with named fields:

```rss
struct Stats {
    score: int
}

struct Profile {
    stats: Stats
}
```

Construct an object with braces and fields. Nested braces construct nested values:

```rss
let profile: Profile = {stats: {score: closure_value}};
```

Field access uses `.`. Optional field access uses `?.` when the preceding value can be absent.

## Functions and generics

Declare a function with `fn`; `pub fn` exports it from a module. Parameters and return schemas may be declared. Generic parameters use angle brackets, and a generic call can use turbofish arguments.

```rss
fn identity<T>(value: T) -> T { value }
fn apply<T>(mapper: fn(T) -> T, value: T) -> T { mapper(value) }
apply::<int>(identity, 42);
```

Direct calls to declared functions are implemented. Function declarations and closures participate in compiler callable analysis; runtime callable values remain under active development.

## Closures

RSS closure literals use pipe parameters and an expression body:

```rss
let base = 7;
let add = |value| value + base;
let closure_value = add(5);
```

JavaScript arrow-closure syntax is not RSS syntax.

## Expressions and operators

RSS supports grouped expressions, calls, indexing, field access, optional access, array literals, object literals, `if` expressions, `match` expressions, and closure literals.

Operator precedence proceeds from logical OR to logical AND, comparison, addition/subtraction, multiplication/division/remainder, unary operators, and primary/postfix expressions.

| Operators | Category |
|---|---|
| `||`, `&&` | Logical OR and AND |
| `==`, `!=`, `<`, `<=`, `>`, `>=` | Comparison |
| `+`, `-`, `*`, `/`, `%` | Arithmetic |
| `!`, `-`, `&`, `&mut` | Unary negation, logical not, and borrow |
| `=`, `+=` | Assignment |
| `?` and `?.` | Optional access |
| `[]`, `.` | Index and field access |

## Control flow

Statement `if` supports `if`, `else if`, and `else`. `if` also works as an expression with `=>` branches:

```rss
let total = if !string::non_empty("rustscript") => {
    let zeroed = 0;
    zeroed
} else => {
    let bumped = total + 1;
    bumped
};
```

`while` repeats while its condition is true. `for` supports range iteration, including `0..end` and `0..=end`, collection iteration, map iteration, and the parser's C-style `for` form. `break` and `continue` are valid only inside loops. `return` is available in the RustScript dialect.

## Match expressions and patterns

`match` evaluates an expression against patterns. Implemented patterns include literal values, `_`, binding patterns, and constructor patterns such as `Some(value)` and `None`.

```rss
let matched = match profile?.stats?.score {
    None => 0,
    Some(score) => if score == 12 => { closure_value } else => { 0 },
    _ => 0,
};
```

## Collections

Array values use `[]`; map and object-style literals use `{}` according to their field or key form. Index expressions read collection items. An assignment target can be a local, field, or supported index expression.

```rss
let a = [1, "a"];
let b = a[1];
```

## Host calls and built-ins

A host function is a function registered by the embedding runtime. Import its namespace with `use` and call it through that namespace. The language parser records host imports; the host validates and supplies the callable implementation.

Built-ins and standard-library modules are regular RSS calls from the script author's perspective. Host-specific names, arguments, return values, and lifecycle rules belong to the runtime that registered them. See [Host functions](/docs/reference/host-functions/).

## Compatibility language features

The shared parser also supports JavaScript and Lua compatibility frontends. `import`, JavaScript `require`, dotted JavaScript calls, `typeof`, increment operators, and arrow closures are controlled by frontend dialect options. They are not part of the RSS surface unless a documented RSS feature explicitly uses them.

## Callable development status

Function values are under active development. The current branch has compiler tests for generic function values, higher-order parameters, returned functions, escaping closures, mutable capture state, and independent closure factories. The following accepted test program passes a generic function as a parameter:

```rss
fn identity<T>(value: T) -> T { value }
fn apply<T>(mapper: fn(T) -> T, value: T) -> T { mapper(value) }
apply::<int>(identity, 42);
```
