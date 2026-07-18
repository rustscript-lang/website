<!-- docs-title: Bindings, Mutability, and Ownership -->

Bindings are immutable unless declared with `mut`. Primitive values copy; owned heap values move unless a copy or borrow is requested.

## Immutable bindings

`let` creates an immutable local.

```rss
let answer = 42;
let language = "RustScript";
answer + language.length;
```

## Mutable bindings

`let mut` permits later assignment.

```rss
let mut total = 1;
total = total + 2;
total;
```

## Compound assignment

`+=` is available for numeric mutable locals.

```rss
let mut total: int = 10;
total += 5;
total;
```

## Primitive copies

Reading an `int`, `float`, or `bool` copies the value, so the source remains available.

```rss
let first = 21;
let second = first;
first + second;
```

## Moves

Owned strings, bytes, arrays, maps, structs, and callable environments move when consumed by value.

```rss
let source = "payload";
let moved = source;
moved.length;
```

After the move, using `source` again is rejected by ownership analysis.

## Explicit copies

`.copy()` duplicates an owned value and leaves the source available.

```rss
let source = "payload";
let duplicated = source.copy();
source.length + duplicated.length;
```

## Shared borrows

`&value` passes a borrowed view without consuming the source.

```rss
fn length_of(value: string) -> int {
    value.length
}
let text = "borrowed";
let size = length_of(&text);
text.length + size;
```

## Mutable borrows

`&mut value` requires a mutable local, field, or index target.

```rss
let mut text = "mutable";
let borrowed = &mut text;
text.length + borrowed.length;
```

## Field moves and copies

Primitive fields copy automatically. Owned fields move unless `.copy()` or a borrow is used.

```rss
let mut record = {count: 2, name: "rss"};
let copied_count = record.count;
let copied_name = record.name.copy();
record.count + copied_count + record.name.length + copied_name.length;
```

## Index moves and mutation

Indexing an owned element can move it. Mutable containers support indexed assignment.

```rss
let mut values = ["a", "b"];
let first = values[0];
values[0] = "updated";
first + values[0].copy();
```

## Capture ownership

Closures and nested functions follow the same move, copy, and borrow expressions when capturing outer locals.

```rss
let suffix = "!";
let append = |text| text + suffix.copy();
let original = suffix;
append("rss") + original;
```
