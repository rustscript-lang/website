<!-- docs-title: Control Flow and Pattern Matching -->

RustScript provides statement and expression forms of `if`, expression-oriented `match`, `while`, range and collection iteration, borrowed map iteration, `break`, and `continue`.

## `if` statements

Statement `if` executes a block when its condition is true.

```rss
let mut answer = 0;
if true {
    answer = 42;
}
answer;
```

## `else if` and `else`

Statement branches are selected from top to bottom.

```rss
let value = 7;
let mut label = "";
if value < 0 {
    label = "negative";
} else if value == 0 {
    label = "zero";
} else {
    label = "positive";
}
label;
```

## `if` expressions

Expression `if` uses `=>` and requires an `else`. Each branch ends with its result expression.

```rss
let enabled = true;
let answer = if enabled => {
    let base = 40;
    base + 2
} else => {
    0
};
answer;
```

## Literal and wildcard patterns

`match` supports integer, string, and bytes literals plus the `_` wildcard. There is no `null` literal or `null` pattern: absence is matched with `None`, and a value match still requires a trailing `_` arm.

```rss
let code = 2;
let label = match code {
    1 => "one",
    2 => "two",
    _ => "other",
};
label;
```

## `Option` constructor patterns

`Some(name)` binds a present payload and `None` matches the absent variant. Those two arms make an `Option` match exhaustive, so no wildcard is required.

```rss
let candidate: Option<int> = Some(41);
let answer = match candidate {
    Some(value) => value + 1,
    None => 0,
};
answer;
```

The identifier inside `Some(...)` is always a binding name, never a payload type test: `Some(TypeName)` binds a name spelled `TypeName` and matches any present payload. `Some(_)` accepts a wildcard, while `None(x)` is rejected because `None` carries no payload. Nested constructor patterns such as `Some(None)` are rejected; match the inner value in a second `match` instead.

Bare `Some(name)` and `None` match logical `Option` values.

## `Result` constructor patterns

`Result::Ok(name)` and `Result::Err(name)` bind the success and error payloads, and together they make a `Result` match exhaustive.

```rss
fn parse_flag(flag: bool) -> Result<int, string> {
    if flag => {
        Result::Ok(21)
    } else => {
        Result::Err("flag is off")
    }
}

let message: string = match parse_flag(true) {
    Result::Ok(inner) => "ok",
    Result::Err(error) => error,
};
let failure: string = match parse_flag(false) {
    Result::Ok(inner) => "ok",
    Result::Err(error) => error,
};
[message, failure];
```

`Result` and `Option` constructor arms cannot be mixed in one `match`, and neither can be mixed with literal arms; match the inner value in a second `match` when both channels need inspection.

## `while` loops

`while` repeats while its boolean condition remains true.

```rss
let mut count = 0;
while count < 3 {
    count += 1;
}
count;
```

## Range `for` loops

`start..end` excludes `end`; `start..=end` includes it.

```rss
let mut exclusive = 0;
for value in 0..3 {
    exclusive += value;
}
let mut inclusive = 0;
for value in 1..=3 {
    inclusive += value;
}
exclusive + inclusive;
```

## Array iteration by index

Use a range over `.length` to traverse an array.

```rss
let values = [1, 2, 3];
let mut sum = 0;
for index in 0..values.length {
    sum += values[index];
}
sum;
```

## Borrowed map iteration

`for (key, value) in &map` iterates entries without creating a keys array. The source map cannot be mutated during the loop.

```rss
let values: map<int> = {a: 1, b: 2, c: 3};
let mut sum: int = 0;
let mut names: string = "";
for (key: string, value: int) in &values {
    names = names + key;
    sum = sum + value;
}
[sum, names.length];
```

## `break`

`break;` exits the nearest loop.

```rss
let mut count = 0;
while true {
    count += 1;
    if count == 3 {
        break;
    }
}
count;
```

## `continue`

`continue;` skips to the next iteration.

```rss
let mut total = 0;
for value in 0..5 {
    if value == 2 {
        continue;
    }
    total += value;
}
total;
```
