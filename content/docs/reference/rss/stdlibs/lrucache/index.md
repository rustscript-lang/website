<!-- docs-title: lrucache -->

`stdlib::rss::lrucache`

A generic least-recently-used cache implemented in pure RustScript.

## Import

```rss
use stdlib::rss::lrucache;
```

## Data types

| Type | Description |
| --- | --- |
| [`LruCacheState`](#lrucachestate) | Opaque cache state passed to and returned by cache operations. |
| [`LruPeekResult`](#lrupeekresult) | Result of a non-promoting cache lookup. |
| [`LruGetResult`](#lrugetresult) | Result of a promoting cache lookup, including the updated cache state. |
| [`LruEntryReport`](#lruentryreport) | Optional oldest or newest cache entry. |
| [`LruEntryRow`](#lruentryrow) | Key-value row returned by `entries`. |

## Data type details

### `LruCacheState`

```rss
struct LruCacheState<K, V> {
    capacity: int,
    size: int,
    next_id: int,
    head: int,
    tail: int,
    lookup: map<int>,
    nodes: map<LruNode<K, V>>
}
```

Opaque cache state passed to and returned by cache operations.

### `LruPeekResult`

```rss
struct LruPeekResult<V> {
    found: bool,
    value: V
}
```

Result of a non-promoting cache lookup.

### `LruGetResult`

```rss
struct LruGetResult<K, V> {
    cache: LruCacheState<K, V>,
    found: bool,
    value: V
}
```

Result of a promoting cache lookup, including the updated cache state.

### `LruEntryReport`

```rss
struct LruEntryReport<K, V> {
    found: bool,
    key: K,
    value: V
}
```

Optional oldest or newest cache entry.

### `LruEntryRow`

```rss
struct LruEntryRow<K, V> {
    key: K,
    value: V
}
```

Key-value row returned by `entries`.

## Functions

| Function | Description |
| --- | --- |
| [`new`](#new) | Creates an LRU cache with the given capacity. |
| [`capacity`](#capacity) | Returns the cache capacity. |
| [`len`](#len) | Returns the number of cached entries. |
| [`is_empty`](#is-empty) | Returns whether the cache is empty. |
| [`has`](#has) | Returns whether the cache contains a key. |
| [`peek`](#peek) | Returns the cached value without updating recency. |
| [`get`](#get) | Returns the cached value and promotes it to the most recently used position. |
| [`put`](#put) | Inserts or updates a cache entry and returns the next cache state. |
| [`touch`](#touch) | Promotes a key to the most recently used position if it exists. |
| [`remove`](#remove) | Removes a cache entry by key. |
| [`clear`](#clear) | Removes all entries from the cache. |
| [`keys`](#keys) | Returns cache keys from oldest to newest. |
| [`values`](#values) | Returns cache values from oldest to newest. |
| [`entries`](#entries) | Returns cache entries from oldest to newest. |
| [`oldest`](#oldest) | Returns the oldest cache entry report. |
| [`newest`](#newest) | Returns the newest cache entry report. |

## Function details

### `new`

```rss
pub fn new<K, V>(raw_capacity: int) -> LruCacheState<K, V>
```

Creates an LRU cache with the given capacity.

### `capacity`

```rss
pub fn capacity<K, V>(cache: LruCacheState<K, V>) -> int
```

Returns the cache capacity.

### `len`

```rss
pub fn len<K, V>(cache: LruCacheState<K, V>) -> int
```

Returns the number of cached entries.

### `is_empty`

```rss
pub fn is_empty<K, V>(cache: LruCacheState<K, V>) -> bool
```

Returns whether the cache is empty.

### `has`

```rss
pub fn has<K, V>(cache: LruCacheState<K, V>, key: K) -> bool
```

Returns whether the cache contains a key.

### `peek`

```rss
pub fn peek<K, V>(cache: LruCacheState<K, V>, key: K) -> LruPeekResult<V>
```

Returns the cached value without updating recency.

### `get`

```rss
pub fn get<K, V>(cache: LruCacheState<K, V>, key: K) -> LruGetResult<K, V>
```

Returns the cached value and promotes it to the most recently used position.

### `put`

```rss
pub fn put<K, V>(cache: LruCacheState<K, V>, key: K, value: V) -> LruCacheState<K, V>
```

Inserts or updates a cache entry and returns the next cache state.

### `touch`

```rss
pub fn touch<K, V>(cache: LruCacheState<K, V>, key: K) -> LruCacheState<K, V>
```

Promotes a key to the most recently used position if it exists.

### `remove`

```rss
pub fn remove<K, V>(cache: LruCacheState<K, V>, key: K) -> LruCacheState<K, V>
```

Removes a cache entry by key.

### `clear`

```rss
pub fn clear<K, V>(cache: LruCacheState<K, V>) -> LruCacheState<K, V>
```

Removes all entries from the cache.

### `keys`

```rss
pub fn keys<K, V>(cache: LruCacheState<K, V>) -> [K]
```

Returns cache keys from oldest to newest.

### `values`

```rss
pub fn values<K, V>(cache: LruCacheState<K, V>) -> [V]
```

Returns cache values from oldest to newest.

### `entries`

```rss
pub fn entries<K, V>(cache: LruCacheState<K, V>) -> [LruEntryRow<K, V>]
```

Returns cache entries from oldest to newest.

### `oldest`

```rss
pub fn oldest<K, V>(cache: LruCacheState<K, V>) -> LruEntryReport<K, V>
```

Returns the oldest cache entry report.

### `newest`

```rss
pub fn newest<K, V>(cache: LruCacheState<K, V>) -> LruEntryReport<K, V>
```

Returns the newest cache entry report.
