<!-- docs-title: Type Inference and Annotations -->

RustScript infers local and expression schemas, then checks them against explicit annotations and function signatures.

## Local inference

An unannotated `let` binding receives the schema inferred from its initializer.

```rss
let count = 42;
let ratio = 0.5;
let name = "RustScript";
let enabled = true;
```

## Explicit annotations

Add `: Schema` when an API boundary or collection shape should be explicit.

```rss
let count: int = 42;
let names: array<string> = ["Ada", "Grace"];
let scores: map<int> = {alice: 10, bob: 12};
```

## Numeric widening

Known mixed numeric arithmetic widens to `float`; integer-only arithmetic remains `int`.

```rss
let integer_total = 20 + 22;
let floating_total = 20 + 0.5;
let quotient: float = floating_total / 2.0;
```

## String concatenation

`+` is inferred as concatenation when either operand is known to be `string`.

```rss
let version = 7;
let label = "release-" + version;
let full = label + "-rss";
```

## Collection inference

Array and map literals infer an element or value schema from their members. An annotation can enforce the intended shape.

```rss
let inferred_numbers = [1, 2, 3];
let typed_numbers: array<int> = [4, 5, 6];
let inferred_map = {left: 10, right: 20};
let typed_map: map<int> = {top: 1, bottom: 2};
```

## Branch result merging

Every branch of an `if` or `match` expression must merge to a compatible schema.

```rss
let use_primary = true;
let selected: int = if use_primary => {
    42
} else => {
    0
};
```

## `Option` refinement

An `Option<T>`, `Result<T, E>`, or bare `()` annotation fixes a schema that inference cannot pick on its own. Matching a constructor arm refines the payload to its concrete schema inside that arm, while the absent arm contributes no payload type.

```rss
fn describe(candidate: Option<int>) -> string {
    match candidate {
        Option::Some(value) => "present " + value,
        Option::None => "absent",
    }
}
let present: Option<int> = Option::Some(41);
let absent: Option<int> = Option::None;
let promoted: Option<int> = present.map(|value| value + 1);
describe(promoted) + describe(absent);
```

`Option::Some` infers its payload schema from the payload it carries, but `Option::None` has no payload to infer from, so it needs an annotation or another contextual type; a bare `Result::Ok(7)` is in the same position. Missing type arguments are rejected rather than invented as `unknown`.

```rss
let failure: Result<int, string> = Result::Err("missing field");
let status: string = match failure {
    Result::Ok(code) => "ok",
    Result::Err(reason) => reason,
};
status;
```

## Explicit generic calls

Named generic calls use turbofish syntax to select concrete type arguments.

```rss
fn identity<T>(value: T) -> T {
    value
}
let answer: int = identity::<int>(42);
let text: string = identity::<string>("rss");
```

## Callable contextual inference

A callable annotation or higher-order parameter supplies the type arguments for a bare generic function value.

```rss
fn identity<T>(value: T) -> T {
    value
}
let int_identity: fn(int) -> int = identity;
int_identity(42);
```

## `unknown` placeholder

The parser recognizes `unknown` for frontend and diagnostic plumbing, but strict native RSS requires concrete compile-time schemas and rejects explicit `unknown` annotations.

```rss
// Invalid in strict native RSS: the annotation is unresolved.
let value: unknown = 42;
value;
```

## Inference errors

Known incompatible values are compile errors rather than silently becoming a dynamic union.

```rss
let condition = true;
// Invalid: the branches infer int and string.
let invalid = if condition => { 1 } else => { "one" };
```
