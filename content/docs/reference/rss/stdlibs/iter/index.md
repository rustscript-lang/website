<!-- docs-title: iter -->

`stdlib::rss::iter`

Range, collection traversal, transformation, filtering, and reduction helpers.

## Import

```rss
use stdlib::rss::iter;
```

## Functions

| Function | Description |
| --- | --- |
| [`range_step`](#range-step) | Returns an array of numbers from start to stop using the given step. |
| [`range`](#range) | Returns an array of numbers from 0 up to stop. |
| [`enumerate`](#enumerate) | Returns [index, value] pairs for an array. |
| [`zip`](#zip) | Zips two arrays into [lhs, rhs] pairs up to the shorter length. |
| [`take`](#take) | Returns the first count values from an array. |
| [`skip`](#skip) | Returns an array without the first count values. |
| [`chunk`](#chunk) | Splits an array into fixed-size chunks. |
| [`sum`](#sum) | Returns the sum of numeric values. |
| [`any_true`](#any-true) | Returns whether any value in an array is truthy. |
| [`all_true`](#all-true) | Returns whether every value in an array is truthy. |
| [`map`](#map) | Applies a function to each value in an array. |
| [`filter`](#filter) | Returns the values for which pred(value) is true. |
| [`reduce`](#reduce) | Reduces an array by applying func(acc, value) from left to right. |
| [`each`](#each) | Calls a function for each value in an array and returns null. |

## Function details

### `range_step`

```rss
pub fn range_step(start: int, stop: int, step: int) -> [int]
```

Returns an array of numbers from start to stop using the given step.

### `range`

```rss
pub fn range(stop: int) -> [int]
```

Returns an array of numbers from 0 up to stop.

### `enumerate`

```rss
pub fn enumerate<T>(values: [T]) -> [[int, T]]
```

Returns [index, value] pairs for an array.

### `zip`

```rss
pub fn zip<L, R>(lhs: [L], rhs: [R]) -> [[L, R]]
```

Zips two arrays into [lhs, rhs] pairs up to the shorter length.

### `take`

```rss
pub fn take<T>(values: [T], count: int) -> [T]
```

Returns the first count values from an array.

### `skip`

```rss
pub fn skip<T>(values: [T], count: int) -> [T]
```

Returns an array without the first count values.

### `chunk`

```rss
pub fn chunk<T>(values: [T], size: int) -> [[T]]
```

Splits an array into fixed-size chunks.

### `sum`

```rss
pub fn sum(values: [number]) -> number
```

Returns the sum of numeric values.

### `any_true`

```rss
pub fn any_true(values: [bool]) -> bool
```

Returns whether any value in an array is truthy.

### `all_true`

```rss
pub fn all_true(values: [bool]) -> bool
```

Returns whether every value in an array is truthy.

### `map`

```rss
pub fn map<T, U>(values: [T], func: fn(T) -> U) -> [U]
```

Applies a function to each value in an array.

### `filter`

```rss
pub fn filter<T>(values: [T], pred: fn(T) -> bool) -> [T]
```

Returns the values for which pred(value) is true.

### `reduce`

```rss
pub fn reduce<T, U>(values: [T], init: U, func: fn(U, T) -> U) -> U
```

Reduces an array by applying func(acc, value) from left to right.

### `each`

```rss
pub fn each<T, U>(values: [T], func: fn(T) -> U) -> null
```

Calls a function for each value in an array and returns null.
