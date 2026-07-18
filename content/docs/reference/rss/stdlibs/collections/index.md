<!-- docs-title: collections -->

`stdlib::rss::collections`

Generic array and map helpers.

## Import

```rss
use stdlib::rss::collections;
```

## Functions

| Function | Description |
| --- | --- |
| [`index_of`](#index-of) | Returns the first index of a value in an array, or -1 when it is absent. |
| [`contains`](#contains) | Returns whether an array contains a value. |
| [`reverse`](#reverse) | Returns a reversed copy of an array. |
| [`dedup`](#dedup) | Returns an array with duplicate values removed. |
| [`has`](#has) | Returns whether a map contains a key. |
| [`get_or`](#get-or) | Returns a map value or a fallback when the key is absent. |
| [`values`](#values) | Returns the values from a map as an array. |
| [`entries`](#entries) | Returns the [key, value] pairs from a map as an array. |
| [`merge`](#merge) | Merges two maps, preferring values from rhs for duplicate keys. |

## Function details

### `index_of`

```rss
pub fn index_of<T>(values: [T], needle: T) -> int
```

Returns the first index of a value in an array, or -1 when it is absent.

### `contains`

```rss
pub fn contains<T>(values: [T], needle: T) -> bool
```

Returns whether an array contains a value.

### `reverse`

```rss
pub fn reverse<T>(values: [T]) -> [T]
```

Returns a reversed copy of an array.

### `dedup`

```rss
pub fn dedup<T>(values: [T]) -> [T]
```

Returns an array with duplicate values removed.

### `has`

```rss
pub fn has<K, V>(map: map<V>, key: K) -> bool
```

Returns whether a map contains a key.

### `get_or`

```rss
pub fn get_or<K, V>(map: map<V>, key: K, fallback: V) -> V
```

Returns a map value or a fallback when the key is absent.

### `values`

```rss
pub fn values<V>(map: map<V>) -> [V]
```

Returns the values from a map as an array.

### `entries`

```rss
pub fn entries<K, V>(map: map<V>) -> [[K, V]]
```

Returns the [key, value] pairs from a map as an array.

### `merge`

```rss
pub fn merge<V>(lhs: map<V>, rhs: map<V>) -> map<V>
```

Merges two maps, preferring values from rhs for duplicate keys.
