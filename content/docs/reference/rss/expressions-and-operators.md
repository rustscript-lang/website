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
let version = language + " " + 1;
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

`value[index]` reads arrays, maps, strings, and bytes according to the container contract.

```rss
let values = [10, 20, 30];
let labels = {answer: 42};
values[1] + labels["answer"];
```

## Optional access

`?.` and `?.[]` propagate `null` instead of failing at an absent optional step.

```rss
struct State {
    values: array<int>,
}
let state: State? = null;
let value = state?.values?.[0];
value == null;
```

## Copy expressions

`.copy()` explicitly duplicates an owned value.

```rss
let original = "rss";
let duplicate = original.copy();
original + duplicate;
```
