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

`match` supports integer, string, `null`, and wildcard patterns.

```rss
let code = 2;
let label = match code {
    1 => "one",
    2 => "two",
    null => "missing",
    _ => "other",
};
label;
```

## `Some`, `None`, and binding patterns

`Some(name)` binds a present value; `None` matches `null`.

```rss
let candidate: int? = 41;
let answer = match candidate {
    Some(value) => value + 1,
    None => 0,
    _ => 0,
};
answer;
```

## Type patterns

`Some(String)`, `Some(Number)`, and the other supported type constructors test a runtime value category.

```rss
let value = "rss";
let category = match value {
    Some(String) => "text",
    Some(Number) => "number",
    _ => "other",
};
category;
```

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
