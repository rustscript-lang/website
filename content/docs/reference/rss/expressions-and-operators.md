<!-- docs-title: Expressions and Operators -->

Expressions produce values. Operator precedence follows logical OR, logical AND, comparison, addition/subtraction, multiplication/division/remainder, unary operators, then primary and postfix access.

## Arithmetic operators

`+`, `-`, `*`, `/`, and `%` operate on numeric values. Unary `-` negates a number.

```rss
let sum = 20 + 22;
let difference = sum - 2;
let product = difference * 3;
let quotient = product / 2;
let remainder = quotient % 5;
-remainder;
```

## Comparison operators

`==`, `!=`, `<`, `<=`, `>`, and `>=` produce `bool`.

```rss
let value = 42;
let exact = value == 42;
let different = value != 0;
let ordered = value > 10 && value >= 42 && value < 100 && value <= 42;
exact && different && ordered;
```

## Logical operators

`!` negates a boolean. `&&` and `||` short-circuit from left to right.

```rss
let ready = true;
let failed = false;
let should_run = ready && !failed;
let should_report = failed || should_run;
should_report;
```

## Precedence and grouping

Parentheses override normal precedence.

```rss
let normal = 2 + 3 * 4;
let grouped = (2 + 3) * 4;
normal + grouped;
```

## String concatenation

`+` concatenates when either known operand is `string`.

```rss
let language = "Rust" + "Script";
let version = language + " " + "4";
version;
```

## Function-call expressions

Call a named function or callable value with parentheses and comma-separated arguments.

```rss
fn add(left: int, right: int) -> int {
    left + right
}
let operation = add;
add(20, 22) + operation(1, 2);
```

## Namespace-call expressions

Use `::` for builtin, standard-library, and imported host namespace calls.

```rss
use math;
let root = math::sqrt(81);
let bounded = math::min(root, 10);
bounded;
```

## Field access

`.` reads a struct or object field. `.length` is available on supported strings, bytes, arrays, and maps.

```rss
struct Point {
    x: int,
    y: int,
}
let point: Point = {x: 20, y: 22};
point.x + point.y;
```

## Index access

`value[index]` reads arrays, maps, strings, and bytes according to the container contract. Array and byte indexes must be in range and non-negative; a map key that was never written is a fatal `map key not found` error rather than an absent value, so test it with `has` or project it with `?.[]` when absence is expected.

```rss
let values = [10, 20, 30];
let labels = {answer: 42};
let present = labels.has("answer");
let fallback = if present => { labels["answer"] } else => { 0 };
values[1] + fallback;
```

## Fallible projection

`receiver?.field` and `receiver?.[index]` are fallible projection. They evaluate to an `Option` of the projected value: a missing map key, an out-of-range array or string index, or a receiver that is already `None` produces `None` instead of failing. Neither form propagates out of the enclosing function.

```rss
struct State {
    values: array<int>,
}
let state: State = {values: [41]};
let present: Option<int> = state?.values?.[0];
let missing: Option<int> = state?.values?.[5];
let answered: int = match present {
    Some(value) => value,
    None => 0,
};
answered + missing.unwrap_or(-1);
```

The receiver set is narrow: field projection admits a struct schema or a declared `map<T>`, index projection additionally admits a declared array, `string`, or `bytes`, and a chain rooted in such a local is admitted like the local itself. Everything else — `int`, `number`, a `Result`, an unresolved generic parameter — is refused by the checker, and a binding without a declared schema fails with `optional access requires a user-declared schema in RustScript`.

## Propagation

`?` is postfix propagation, not a type suffix. On an `Option` operand it passes a `Some` payload through and exits the current `Option`-returning function on `None`; on a `Result` operand it passes an `Ok` payload through and returns the original `Err`. Error types must match exactly — use `map_err` or `ok_or` for an explicit conversion, because no implicit error conversion is inserted.

```rss
fn parse_number(text: string) -> Result<int, string> {
    if text == "42" => {
        Result::Ok(42)
    } else => {
        Result::Err("not 42")
    }
}

fn doubled(text: string) -> Result<int, string> {
    let value = parse_number(text)?;
    Result::Ok(value * 2)
}

doubled("42").unwrap_or(-1) + doubled("other").unwrap_or(0);
```

Arguments, statements, and side effects after a propagating `?` do not run, and a `?` inside a closure exits that closure rather than its caller. `?` is rejected in a root script, in a function whose return type is not a matching `Option` or `Result`, on an operand of another type, on an optional `Result`, and on a mismatched error type.

## Copy expressions

`.copy()` explicitly duplicates an owned value.

```rss
let original = "rss";
let duplicate = original.copy();
original + duplicate;
```
