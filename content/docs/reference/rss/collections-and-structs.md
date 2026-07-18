<!-- docs-title: Collections, Structs, and Optional Values -->

RustScript provides arrays, maps, named structs, generic structs, optional schemas, indexed access, optional chaining, and slicing.

## Array literals

Square brackets create arrays. Elements are evaluated from left to right.

```rss
let numbers = [1, 2, 3];
let words = ["rust", "script"];
numbers.length + words.length;
```

## Array schemas

Homogeneous arrays can be written as `array<T>`, `[T]`, or `T[]`.

```rss
let first: array<int> = [1, 2];
let second: [string] = ["a", "b"];
let third: bool[] = [true, false];
first.length + second.length + third.length;
```

## Tuple and variadic array schemas

Bracket schemas can describe fixed prefixes and a repeated tail.

```rss
let pair: [int, string] = [40, "ok"];
let row: [int, string...] = [1, "a", "b"];
pair[0] + pair[1].length + row[0] + row.length;
```

## Array indexing and append

Use `array[index]` to read or replace an element. Assigning at `.length` appends.

```rss
let mut values: array<int> = [1, 2];
values[0] = 10;
values[values.length] = 3;
values[0] + values[2];
```

## Map literals and schemas

Brace literals with key/value entries create maps. `map<T>` constrains the value schema.

```rss
let scores: map<int> = {alice: 10, bob: 12};
let selected = scores["alice"];
let count = scores.length;
selected + count;
```

## Struct declarations

A `struct` declares named fields. A typed brace literal constructs the value.

```rss
struct User {
    name: string,
    score: int,
}
let user: User = {name: "Ada", score: 42};
user.name.length + user.score;
```

## Generic structs

Structs can declare type parameters and be instantiated with concrete schemas.

```rss
struct Box<T> {
    value: T,
}
let boxed: Box<int> = {value: 42};
boxed.value;
```

## Optional schemas

`T?` accepts either a value of `T` or `null`. `Some(name)` and `None` are match patterns, not value constructors.

```rss
let present: int? = 42;
let absent: int? = null;
let direct: string? = null;
let has_value = match present {
    Some(value) => value == 42,
    None => false,
    _ => false,
};
let is_absent = match absent {
    None => true,
    _ => false,
};
let direct_is_absent = match direct {
    None => true,
    _ => false,
};
has_value && is_absent && direct_is_absent;
```

## Optional field and index access

`?.field` and `?.[index]` return `null` when any preceding optional step is absent.

```rss
struct Data {
    values: array<int>,
}
let data: Data? = {values: [41]};
let present = data?.values?.[0];
let missing = data?.values?.[5];
present != null && missing == null;
```

## Slices

Strings, bytes, and arrays support `[start:end]`, `[:end]`, and `[start:]`. Negative bounds count from the end.

```rss
let text = "abcdef";
let middle = text.copy()[1:4];
let prefix = text.copy()[:2];
let suffix = text.copy()[-2:];
let values = [1, 2, 3, 4];
let tail = values.copy()[2:];
middle.length + prefix.length + suffix.length + tail.length;
```

## Nested values

Structs, arrays, and maps compose recursively.

```rss
struct Profile {
    name: string,
    tags: array<string>,
    scores: map<int>,
}
let profile: Profile = {
    name: "Ada",
    tags: ["compiler", "vm"],
    scores: {main: 42},
};
profile.tags[0].copy() + profile.name;
```
