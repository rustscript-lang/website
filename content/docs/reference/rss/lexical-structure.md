<!-- docs-title: Lexical Structure -->

RSS source is UTF-8 text. Whitespace separates tokens, comments are discarded, and semicolons terminate statements where the grammar requires them.

## Line comments

`//` continues to the end of the current line.

```rss
// A complete line comment.
let answer = 42; // A trailing comment.
answer;
```

## Block comments

`/* ... */` may span lines.

```rss
/* Compute the public result.
   This comment spans two lines. */
let answer = 40 + 2;
answer;
```

## Identifiers

Identifiers begin with an ASCII letter or `_` and continue with ASCII letters, digits, or `_`.

```rss
let answer_42 = 42;
let _internal = answer_42;
let final_result = _internal;
final_result;
```

## Keywords

Reserved words introduce declarations and control flow. Type names such as `int` and `string` are schema identifiers interpreted in type position.

```rss
pub fn choose(value: int?) -> int {
    match value {
        Some(found) => found,
        None => 0,
        _ => 0,
    }
}
let mut result = choose(42);
result;
```

| Declarations | Control flow | Literals and bindings |
|---|---|---|
| `pub`, `fn`, `struct`, `use`, `as` | `if`, `else`, `while`, `for`, `in`, `match`, `break`, `continue` | `let`, `true`, `false`, `null` |

## Integer literals

Integers are decimal or hexadecimal. The accepted range is signed 64-bit.

```rss
let decimal = 42;
let hexadecimal = 0x2A;
let minimum = -9223372036854775808;
decimal + hexadecimal + minimum;
```

## Floating-point literals

A decimal point followed by at least one digit produces a `float` literal.

```rss
let one = 1.0;
let fraction = 0.125;
let negative = -2.5;
one + fraction + negative;
```

## String literals and escapes

Single and double quotes both create strings. Supported escapes include `\n`, `\r`, `\t`, `\\`, `\"`, `\'`, `\0`, and two-digit `\xNN`.

```rss
let double_quoted = "line 1\nline 2";
let single_quoted = 'RustScript';
let escaped = "\x52\x53\x53\0";
double_quoted + single_quoted + escaped;
```

## Byte literals and escapes

Prefix a double-quoted literal with `b` to create `bytes`. Byte escapes use the same spellings and `\xNN` inserts one byte.

```rss
let header = b"RSS\x00";
let control = b"\n\t";
header.length + control.length;
```

## Delimiters and punctuation

Parentheses group expressions and calls, braces delimit blocks and maps, brackets delimit arrays and indexes, commas separate items, colons attach schemas or values, and `::` selects namespace members.

```rss
use math;
let values: array<int> = [1, 2, 3];
let record = {answer: values[0] + values[1]};
math::max(record.answer, values[2]);
```

## Statement semicolons

Bindings, assignments, calls used as statements, `break`, and `continue` end with `;`.

```rss
let mut value = 0;
value = 41;
value += 1;
value;
```

## Trailing result expressions

A function body or expression branch returns its final expression without requiring a trailing semicolon.

```rss
fn answer() -> int {
    let base = 40;
    base + 2
}
let value = if true => { answer() } else => { 0 };
value;
```

## Source files

The native source extension is `.rss`. `pd-vm-run` accepts a file directly.

```rss
// hello.rss
fn greeting(name: string) -> string {
    "hello, " + name
}
greeting("RSS");
```
