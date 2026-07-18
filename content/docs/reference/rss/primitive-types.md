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

## `null`

`null` represents absence. Use `T?` for a value that may contain either `T` or `null`.

```rss
let missing: string? = null;
let present: string? = "ready";
let is_missing = missing == null;
```

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
| `null` | The null value |
| `T?` | `T` or `null` |
