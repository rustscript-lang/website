<!-- docs-title: Collections, Structs, and Optional Values -->

RustScript provides arrays, maps, named structs, generic structs, `Option<T>` and `Result<T, E>` values, indexed access, fallible projection, and slicing.

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

## Map keys, presence, and absence

A map stores entries. A key that was never written is absent, which is not a stored value: indexing a missing key with `map[key]` is a fatal runtime error rather than an absent or `null` value. Test presence with `has`, supply a default with `get_or`, or use fallible projection (`?.[]`, covered below) to turn a missing key into `Option::None`.

An omitted key and a key whose stored value is `Option::None` are different facts. Omitting the key removes the entry; storing `Option::None` keeps the entry with an absent payload. `map<V>` describes values, so a map may hold `Option<V>` values and still have every key present.

```rss
let scores: map<int> = {alice: 10, bob: 12};
let ratings: map<Option<int>> = {carol: Option::None};
let has_carol = scores.has("carol");
let has_bob = scores.has("bob");
let alice = scores["alice"];
let bob = if has_bob => { scores["bob"] } else => { 0 };
let carol_rating: Option<int> = ratings["carol"];
let carol_is_none = match carol_rating {
    Option::Some(inner) => false,
    Option::None => true,
};
has_carol == false && carol_is_none && alice + bob > 0;
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

## `Option` values

`Option<T>` holds either `Option::Some(value)` or `Option::None`, and both spellings are namespace-qualified constructors. `Option<T>` offers `map`, `and_then`, `or_else`, `unwrap_or`, `unwrap_or_else`, `ok_or`, and `ok_or_else`; `unwrap` is rejected, so absence is always handled explicitly. `Option` values can appear inside arrays, maps, structs, generic types, callables, and each other.

```rss
struct Entry {
    topic: string,
    reads: int
}

fn reads(entry: Option<Entry>, fallback: int) -> int {
    match entry {
        Option::Some(item) => item.reads,
        Option::None => fallback,
    }
}

let hit: Option<Entry> = Option::Some({topic: "markets", reads: 7});
let absent: Option<Entry> = Option::None;
let promoted: Option<int> = hit.map(|item| item.reads + 1);
reads(hit, 0) + reads(absent, 5) + promoted.unwrap_or(0);
```

`Option::Some` infers its payload schema when the payload is fully known, while `Option::None` needs an annotation or another contextual type. The variant comes from a carrier tag rather than payload truthiness, so `Option::Some(0)`, `Option::Some(false)`, `Option::Some("")`, `Option::Some(())`, and `Option::None` are all distinct.

## `Result` values

`Result<T, E>` holds either `Result::Ok(value)` or `Result::Err(error)`. `ok()` and `err()` convert a `Result` into an `Option` of the selected channel, which is how a fallible value becomes an optional one without losing the error branch by accident.

```rss
fn load(key: string) -> Result<int, string> {
    if key == "known" => {
        Result::Ok(21)
    } else => {
        Result::Err("unknown key")
    }
}

let loaded: Result<int, string> = load("known");
let value: int = loaded.unwrap_or(-1);
let as_option: Option<int> = load("missing").ok();
let error_text: string = match load("missing").err() {
    Option::Some(reason) => reason,
    Option::None => "no error",
};
value + as_option.unwrap_or(0) + error_text.length;
```

## Fallible field and index projection

`receiver?.field` and `receiver?.[index]` are fallible projection: they evaluate to an `Option` of the projected value instead of failing. A missing map key, an index outside a declared array, an out-of-range string index, or a receiver that is already `Option::None` becomes `Option::None`; a present value becomes `Option::Some`, including `Option::Some(0)`, `Option::Some(false)`, and `Option::Some("")`.

```rss
struct Feed {
    name: string,
    pages: [int],
    tags: map<string>,
}

let feed: Feed = {name: "daily", pages: [10, 20], tags: {kind: "news"}};
let title: Option<string> = feed?.name;
let second: Option<int> = feed?.pages?.[1];
let beyond: Option<int> = feed?.pages?.[9];
let kind: Option<string> = feed?.tags?.["kind"];
let absent_tag: Option<string> = feed?.tags?.["absent"];
let headline: string = "abcdef";
let letter: Option<string> = headline?.[2];
let outside: Option<string> = headline?.[9];
[title, second, beyond, kind, absent_tag, letter, outside];
```

The receiver must have a declared schema: a struct type, a declared `map<T>`, or — for the index form — a declared array, `string`, or `bytes`, and a projection chain rooted in such a local is admitted exactly like the local. A value whose type was never declared is rejected with `optional access requires a user-declared schema in RustScript`, so annotate the binding (`let feed: Feed = make();`) when the type comes from a call. `int`, `number`, a `Result`, and an unresolved generic parameter are refused rather than projected.

`bytes` is the one shape that type-checks but does not project at runtime: the runtime dispatch covers `map`, `array`, and `string`, so a `bytes` receiver lowers to `Option::None` even for an in-range index. Use slice or index access on a `bytes` value that must yield a byte. On an `Option` receiver, `?.` consumes exactly one optional layer, so projecting through `Option<int>` yields `Option<Option<int>>` rather than flattening arbitrarily.

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
