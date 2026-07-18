<!-- docs-title: Syntax Cheatsheet -->

RSS is RustScript's native source language. This reference follows a Rust-like path from primitive schemas through inference, ownership, control flow, generics, callable values, closures, and modules. Every syntax topic includes highlighted RSS examples.

## Types and values

- [Primitive Types and Literals](./primitive-types/) — `int`, `float`, `number`, `bool`, `string`, `bytes`, `null`, and literal forms.
- [Type Inference and Annotations](./type-inference/) — inferred locals, explicit schemas, numeric widening, branch merging, and contextual callable inference.
- [Collections, Structs, and Optional Values](./collections-and-structs/) — arrays, maps, tuple schemas, structs, generics, `T?`, optional chaining, and slices.

## State and expressions

- [Bindings, Mutability, and Ownership](./bindings-and-ownership/) — `let`, `let mut`, assignment, moves, `.copy()`, borrows, fields, indexes, and captures.
- [Expressions and Operators](./expressions-and-operators/) — precedence, arithmetic, comparisons, logical operators, calls, namespace calls, and access expressions.

## Control and abstraction

- [Control Flow and Pattern Matching](./control-flow/) — statement and expression `if`, `match`, `while`, ranges, range-based array traversal, borrowed map iteration, `break`, and `continue`.
- [Functions, Generics, and Recursion](./functions-and-generics/) — block and expression bodies, exports, forward calls, recursion, nested functions, generic parameters, and turbofish.
- [Callables and Closures](./callables-and-closures/) — callable schemas, function values, higher-order functions, callable collections, closures, captures, returned callables, and shared state.

## Programs and tokens

- [Modules, Imports, and Host Calls](./modules-and-imports/) — source modules, aliases, relative paths, builtin and stdlib namespaces, host imports, and formatted output.
- [Lexical Structure](./lexical-structure/) — comments, identifiers, keywords, literals, delimiters, semicolons, trailing result expressions, and `.rss` files.

## Callable catalogs

- [Builtins](./builtins/) — generated RSS builtin namespace pages.
- [Stdlibs](./stdlibs/) — generated standard-library module pages.

## Language boundary

The pages in this branch describe native RSS syntax. Compatibility frontends lower JavaScript-, Lua-, and Python-like source into shared compiler IR; their surface syntax belongs to the corresponding frontend, not RSS.

```rss
fn identity<T>(value: T) -> T {
    value
}
let answer: int = identity::<int>(42);
let render: fn(string) -> string = identity;
answer;
render("rss");
```
