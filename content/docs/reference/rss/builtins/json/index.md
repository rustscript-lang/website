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
| [`encode`](#encode) | Encodes the value as a JSON string through the named schema `T`. The RSS boundary requires the `::<T>` form; an untyped value is rejected at compile time. |
| [`decode`](#decode) | Decodes a JSON document and projects the decoded tree onto the named schema `T`. Duplicate object keys are rejected. A malformed document is a fatal host error rather than a `Result`, so callers cannot branch on decode failure; the `::<T>` type argument is required at the RSS boundary. |

## Function details

### `encode`

```rss
fn encode::<T>(value: T) -> string
```

Encodes the value as a JSON string through the named schema `T`. The RSS boundary requires the `::<T>` form; an untyped value is rejected at compile time.

### `decode`

```rss
fn decode::<T>(text: string) -> T
```

Decodes a JSON document and projects the decoded tree onto the named schema `T`. Duplicate object keys are rejected. A malformed document is a fatal host error rather than a `Result`, so callers cannot branch on decode failure; the `::<T>` type argument is required at the RSS boundary.
