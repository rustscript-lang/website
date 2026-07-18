<!-- docs-title: math -->

`stdlib::rss::math`

Numeric constants, predicates, arithmetic helpers, and transcendental functions.

## Import

```rss
use stdlib::rss::math;
```

## Functions

| Function | Description |
| --- | --- |
| [`pi`](#pi) | Returns the constant pi. |
| [`tau`](#tau) | Returns the constant tau. |
| [`e`](#e) | Returns Euler's number. |
| [`epsilon`](#epsilon) | Returns the machine epsilon for floating-point comparisons. |
| [`inf`](#inf) | Returns positive infinity. |
| [`neg_inf`](#neg-inf) | Returns negative infinity. |
| [`nan`](#nan) | Returns NaN. |
| [`abs`](#abs) | Returns the absolute value of a number. |
| [`min`](#min) | Returns the smaller of two numbers. |
| [`max`](#max) | Returns the larger of two numbers. |
| [`clamp`](#clamp) | Clamps a number to an inclusive range. |
| [`signum`](#signum) | Returns the sign of a number. |
| [`sign`](#sign) | Returns -1, 0, or 1 depending on the sign of a number. |
| [`in_range`](#in-range) | Returns whether a number lies within an inclusive range. |
| [`is_even`](#is-even) | Returns whether a number is even. |
| [`is_odd`](#is-odd) | Returns whether a number is odd. |
| [`sum`](#sum) | Returns the sum of numeric values. |
| [`floor`](#floor) | Rounds a number down to the nearest integer value. |
| [`ceil`](#ceil) | Rounds a number up to the nearest integer value. |
| [`round`](#round) | Rounds a number to the nearest integer value. |
| [`trunc`](#trunc) | Truncates the fractional part of a number. |
| [`fract`](#fract) | Returns the fractional part of a number. |
| [`sqrt`](#sqrt) | Returns the square root of a number. |
| [`cbrt`](#cbrt) | Returns the cube root of a number. |
| [`powf`](#powf) | Raises a number to a floating-point power. |
| [`powi`](#powi) | Raises a number to an integer power. |
| [`exp`](#exp) | Returns e raised to the given power. |
| [`exp2`](#exp2) | Returns 2 raised to the given power. |
| [`ln`](#ln) | Returns the natural logarithm of a number. |
| [`ln_1p`](#ln-1p) | Returns the natural logarithm of one plus a number. |
| [`log`](#log) | Returns the logarithm of a number for the given base. |
| [`log2`](#log2) | Returns the base-2 logarithm of a number. |
| [`log10`](#log10) | Returns the base-10 logarithm of a number. |
| [`sin`](#sin) | Returns the sine of an angle in radians. |
| [`cos`](#cos) | Returns the cosine of an angle in radians. |
| [`tan`](#tan) | Returns the tangent of an angle in radians. |
| [`asin`](#asin) | Returns the arcsine of a number. |
| [`acos`](#acos) | Returns the arccosine of a number. |
| [`atan`](#atan) | Returns the arctangent of a number. |
| [`atan2`](#atan2) | Returns the four-quadrant arctangent of two numbers. |
| [`sinh`](#sinh) | Returns the hyperbolic sine of a number. |
| [`cosh`](#cosh) | Returns the hyperbolic cosine of a number. |
| [`tanh`](#tanh) | Returns the hyperbolic tangent of a number. |
| [`hypot`](#hypot) | Returns the hypotenuse length for two numbers. |
| [`copysign`](#copysign) | Returns the first number with the sign of the second number. |
| [`mul_add`](#mul-add) | Computes a fused multiply-add operation. |
| [`to_degrees`](#to-degrees) | Converts radians to degrees. |
| [`to_radians`](#to-radians) | Converts degrees to radians. |
| [`deg`](#deg) | Converts radians to degrees. |
| [`rad`](#rad) | Converts degrees to radians. |
| [`fmod`](#fmod) | Returns the remainder of dividing lhs by rhs. |
| [`is_nan`](#is-nan) | Returns whether a number is NaN. |
| [`is_infinite`](#is-infinite) | Returns whether a number is infinite. |
| [`is_finite`](#is-finite) | Returns whether a number is finite. |

## Function details

### `pi`

```rss
pub fn pi() -> float
```

Returns the constant pi.

### `tau`

```rss
pub fn tau() -> float
```

Returns the constant tau.

### `e`

```rss
pub fn e() -> float
```

Returns Euler's number.

### `epsilon`

```rss
pub fn epsilon() -> float
```

Returns the machine epsilon for floating-point comparisons.

### `inf`

```rss
pub fn inf() -> float
```

Returns positive infinity.

### `neg_inf`

```rss
pub fn neg_inf() -> float
```

Returns negative infinity.

### `nan`

```rss
pub fn nan() -> float
```

Returns NaN.

### `abs`

```rss
pub fn abs(value: number) -> number
```

Returns the absolute value of a number.

### `min`

```rss
pub fn min(lhs: number, rhs: number) -> number
```

Returns the smaller of two numbers.

### `max`

```rss
pub fn max(lhs: number, rhs: number) -> number
```

Returns the larger of two numbers.

### `clamp`

```rss
pub fn clamp(value: number, lower: number, upper: number) -> number
```

Clamps a number to an inclusive range.

### `signum`

```rss
pub fn signum(value: number) -> number
```

Returns the sign of a number.

### `sign`

```rss
pub fn sign(value: number) -> int
```

Returns -1, 0, or 1 depending on the sign of a number.

### `in_range`

```rss
pub fn in_range(value: number, lower: number, upper: number) -> bool
```

Returns whether a number lies within an inclusive range.

### `is_even`

```rss
pub fn is_even(value: int) -> bool
```

Returns whether a number is even.

### `is_odd`

```rss
pub fn is_odd(value: int) -> bool
```

Returns whether a number is odd.

### `sum`

```rss
pub fn sum(values: [number]) -> number
```

Returns the sum of numeric values.

### `floor`

```rss
pub fn floor(value: number) -> number
```

Rounds a number down to the nearest integer value.

### `ceil`

```rss
pub fn ceil(value: number) -> number
```

Rounds a number up to the nearest integer value.

### `round`

```rss
pub fn round(value: number) -> number
```

Rounds a number to the nearest integer value.

### `trunc`

```rss
pub fn trunc(value: number) -> number
```

Truncates the fractional part of a number.

### `fract`

```rss
pub fn fract(value: number) -> float
```

Returns the fractional part of a number.

### `sqrt`

```rss
pub fn sqrt(value: number) -> float
```

Returns the square root of a number.

### `cbrt`

```rss
pub fn cbrt(value: number) -> float
```

Returns the cube root of a number.

### `powf`

```rss
pub fn powf(value: number, exponent: number) -> float
```

Raises a number to a floating-point power.

### `powi`

```rss
pub fn powi(value: number, exponent: int) -> float
```

Raises a number to an integer power.

### `exp`

```rss
pub fn exp(value: number) -> float
```

Returns e raised to the given power.

### `exp2`

```rss
pub fn exp2(value: number) -> float
```

Returns 2 raised to the given power.

### `ln`

```rss
pub fn ln(value: number) -> float
```

Returns the natural logarithm of a number.

### `ln_1p`

```rss
pub fn ln_1p(value: number) -> float
```

Returns the natural logarithm of one plus a number.

### `log`

```rss
pub fn log(value: number, base: number) -> float
```

Returns the logarithm of a number for the given base.

### `log2`

```rss
pub fn log2(value: number) -> float
```

Returns the base-2 logarithm of a number.

### `log10`

```rss
pub fn log10(value: number) -> float
```

Returns the base-10 logarithm of a number.

### `sin`

```rss
pub fn sin(value: number) -> float
```

Returns the sine of an angle in radians.

### `cos`

```rss
pub fn cos(value: number) -> float
```

Returns the cosine of an angle in radians.

### `tan`

```rss
pub fn tan(value: number) -> float
```

Returns the tangent of an angle in radians.

### `asin`

```rss
pub fn asin(value: number) -> float
```

Returns the arcsine of a number.

### `acos`

```rss
pub fn acos(value: number) -> float
```

Returns the arccosine of a number.

### `atan`

```rss
pub fn atan(value: number) -> float
```

Returns the arctangent of a number.

### `atan2`

```rss
pub fn atan2(y: number, x: number) -> float
```

Returns the four-quadrant arctangent of two numbers.

### `sinh`

```rss
pub fn sinh(value: number) -> float
```

Returns the hyperbolic sine of a number.

### `cosh`

```rss
pub fn cosh(value: number) -> float
```

Returns the hyperbolic cosine of a number.

### `tanh`

```rss
pub fn tanh(value: number) -> float
```

Returns the hyperbolic tangent of a number.

### `hypot`

```rss
pub fn hypot(lhs: number, rhs: number) -> float
```

Returns the hypotenuse length for two numbers.

### `copysign`

```rss
pub fn copysign(value: number, sign_value: number) -> float
```

Returns the first number with the sign of the second number.

### `mul_add`

```rss
pub fn mul_add(a: number, b: number, c: number) -> float
```

Computes a fused multiply-add operation.

### `to_degrees`

```rss
pub fn to_degrees(value: number) -> float
```

Converts radians to degrees.

### `to_radians`

```rss
pub fn to_radians(value: number) -> float
```

Converts degrees to radians.

### `deg`

```rss
pub fn deg(value: number) -> float
```

Converts radians to degrees.

### `rad`

```rss
pub fn rad(value: number) -> float
```

Converts degrees to radians.

### `fmod`

```rss
pub fn fmod(lhs: number, rhs: number) -> number
```

Returns the remainder of dividing lhs by rhs.

### `is_nan`

```rss
pub fn is_nan(value: number) -> bool
```

Returns whether a number is NaN.

### `is_infinite`

```rss
pub fn is_infinite(value: number) -> bool
```

Returns whether a number is infinite.

### `is_finite`

```rss
pub fn is_finite(value: number) -> bool
```

Returns whether a number is finite.
