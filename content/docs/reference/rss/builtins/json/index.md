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
| [`encode`](#encode) | Encodes the value as a JSON string. The `::<T>` form encodes through the named schema `T`. |
| [`decode`](#decode) | Decodes a JSON document. The `::<T>` form projects the decoded tree onto the named schema `T`. Duplicate object keys are rejected. A malformed document is a fatal host error rather than a `Result`, so callers cannot branch on decode failure yet. |

## Function details

### `encode`

```rss
fn encode(value: any) -> string
```

```rss
fn encode::<T>(value: T) -> string
```

Encodes the value as a JSON string. The `::<T>` form encodes through the named schema `T`.

### `decode`

```rss
fn decode(text: string) -> unknown
```

```rss
fn decode::<T>(text: string) -> T
```

Decodes a JSON document. The `::<T>` form projects the decoded tree onto the named schema `T`. Duplicate object keys are rejected. A malformed document is a fatal host error rather than a `Result`, so callers cannot branch on decode failure yet.
