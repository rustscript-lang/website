<!-- docs-title: Primitive Types and Literals -->

RustScript uses explicit schemas where boundaries need them and infers types for ordinary local expressions. Primitive values are copied by value.

## `int`

`int` is a signed 64-bit integer. Decimal and hexadecimal literals are supported; a leading `-` is a unary operator.

```rss
let decimal: int = 42;
let hexadecimal: int = 0x2A;
let negative: int = -7;
decimal + hexadecimal + negative;
```

## `float`

`float` is an IEEE-754 double-precision value. A decimal point distinguishes a float literal from an integer literal.

```rss
let ratio: float = 1.5;
let offset: float = -0.25;
ratio + offset;
```

## `number`

`number` accepts either `int` or `float` at typed boundaries. Arithmetic between a known integer and float widens to `float`.

```rss
fn double(value: number) -> number {
    value + value
}
let whole: number = 21;
let fractional: number = 1.5;
double(whole) + fractional;
```

## `bool`

`bool` has the literals `true` and `false`. Conditions and logical operators require boolean values.

```rss
let enabled: bool = true;
let visible: bool = false;
enabled && !visible;
```

## `string`

`string` stores UTF-8 text. Both double-quoted and single-quoted literals produce strings.

```rss
let language: string = "RustScript";
let greeting: string = 'hello';
let escaped: string = "line 1\nline 2\x21";
greeting + ", " + language + escaped;
```

## `bytes`

`bytes` stores an owned byte sequence. A byte literal uses `b"..."` and supports byte escapes.

```rss
let signature: bytes = b"RSS\x00";
let newline: bytes = b"\n";
signature.length + newline.length;
```

## Unit `()`

An empty `()` pair spells both the Unit type and the Unit value. A function that declares no return type has the Unit return type, `-> ()` states the same type explicitly, and `()` in expression position produces the value.

```rss
fn record_event() {}
fn acknowledged() -> () {
    ()
}
let literal: () = ();
let from_bare_body: () = record_event();
let from_explicit_body: () = acknowledged();
literal;
```

Unit is a logical type, not a source-level null. The VM carries it in the same slot as its internal Null value, but RSS has no `null` literal and no `null` type: `null` in source is a rejected form rather than Unit or `Option::None`. A Unit value is therefore a real value — it can be bound, passed, and returned — while "no value is absent" is expressed with `Option::None`.

## `Option<T>` and `Result<T, E>`

`Option<T>` is a present payload or nothing: `Option::Some(value)` or `Option::None`. `Result<T, E>` is a success payload or an error payload: `Result::Ok(value)` or `Result::Err(error)`. Both are compiler built-ins, both require their type arguments, and neither is spelled with a `?` type suffix.

```rss
fn score(value: Option<int>, fallback: int) -> int {
    match value {
        Option::Some(inner) => inner,
        Option::None => fallback,
    }
}
let present: Option<int> = Option::Some(42);
let absent: Option<int> = Option::None;
score(present, 0) + score(absent, 1);
```

`Option::Some` can infer its payload type from the payload, while `Option::None` and a bare `Result::Ok(7)` need an annotation or another contextual type. The variants are selected by a carrier tag, never by payload truthiness, so `Option::Some(0)`, `Option::Some(false)`, `Option::Some("")`, and `Option::None` are four different values.

## Primitive schema table

Primitive schemas can appear on locals, function parameters, function results, struct fields, collection elements, and callable signatures.

```rss
fn classify(code: int, weight: float, active: bool, label: string, raw: bytes) -> bool {
    active && code > 0 && weight > 0.0 && label.length > 0 && raw.length > 0
}
classify(7, 1.25, true, "rss", b"ok");
```

| Schema | Accepted values |
|---|---|
| `int` | Signed 64-bit integers |
| `float` | Double-precision floating-point values |
| `number` | `int` or `float` |
| `bool` | `true` or `false` |
| `string` | UTF-8 strings |
| `bytes` | Byte sequences |
| `()` | The Unit value |
| `Option<T>` | `Option::Some(T)` or `Option::None` |
| `Result<T, E>` | `Result::Ok(T)` or `Result::Err(E)` |
