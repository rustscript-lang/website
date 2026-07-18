<!-- docs-title: json -->

`json`

JSON builtin namespace.

**Runtime support:** native and WebAssembly.

## Import

```rss
use json;
```

## Functions

| Function | Description |
| --- | --- |
| [`encode`](#encode) | Encodes a `Value` into a JSON string. |
| [`decode`](#decode) | Decodes a JSON string into a `Value`. |

## Function details

### `encode`

```rss
fn encode(value: any) -> string
```

Encodes a `Value` into a JSON string.

### `decode`

```rss
fn decode(text: string) -> unknown
```

Decodes a JSON string into a `Value`.
Note: This function enforces a strict unique-keys contract for JSON objects.
If the JSON string contains duplicate keys, it will return an error instead of letting the last key win.
