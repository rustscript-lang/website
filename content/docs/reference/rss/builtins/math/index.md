<!-- docs-title: math -->

`math`

Numeric math builtin namespace.

**Runtime support:** native and WebAssembly.

## Import

```rss
use math;
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
| [`sqrt`](#sqrt) | Returns the square root of a number. |
| [`cbrt`](#cbrt) | Returns the cube root of a number. |
| [`exp`](#exp) | Returns e raised to the given power. |
| [`exp2`](#exp2) | Returns 2 raised to the given power. |
| [`ln`](#ln) | Returns the natural logarithm of a number. |
| [`ln_1p`](#ln-1p) | Returns the natural logarithm of one plus a number. |
| [`log2`](#log2) | Returns the base-2 logarithm of a number. |
| [`log10`](#log10) | Returns the base-10 logarithm of a number. |
| [`sin`](#sin) | Returns the sine of an angle in radians. |
| [`cos`](#cos) | Returns the cosine of an angle in radians. |
| [`tan`](#tan) | Returns the tangent of an angle in radians. |
| [`asin`](#asin) | Returns the arcsine of a number. |
| [`acos`](#acos) | Returns the arccosine of a number. |
| [`atan`](#atan) | Returns the arctangent of a number. |
| [`sinh`](#sinh) | Returns the hyperbolic sine of a number. |
| [`cosh`](#cosh) | Returns the hyperbolic cosine of a number. |
| [`tanh`](#tanh) | Returns the hyperbolic tangent of a number. |
| [`floor`](#floor) | Rounds a number down to the nearest integer value. |
| [`ceil`](#ceil) | Rounds a number up to the nearest integer value. |
| [`round`](#round) | Rounds a number to the nearest integer value. |
| [`trunc`](#trunc) | Truncates the fractional part of a number. |
| [`fract`](#fract) | Returns the fractional part of a number. |
| [`signum`](#signum) | Returns the sign of a number. |
| [`to_degrees`](#to-degrees) | Converts radians to degrees. |
| [`to_radians`](#to-radians) | Converts degrees to radians. |
| [`is_nan`](#is-nan) | Returns whether a number is NaN. |
| [`is_infinite`](#is-infinite) | Returns whether a number is infinite. |
| [`is_finite`](#is-finite) | Returns whether a number is finite. |
| [`atan2`](#atan2) | Returns the four-quadrant arctangent of two numbers. |
| [`powf`](#powf) | Raises a number to a floating-point power. |
| [`powi`](#powi) | Raises a number to an integer power. |
| [`hypot`](#hypot) | Returns the hypotenuse length for two numbers. |
| [`log`](#log) | Returns the logarithm of a number for the given base. |
| [`min`](#min) | Returns the smaller of two numbers. |
| [`max`](#max) | Returns the larger of two numbers. |
| [`copysign`](#copysign) | Returns the first number with the sign of the second number. |
| [`clamp`](#clamp) | Clamps a number to an inclusive range. |
| [`mul_add`](#mul-add) | Computes a fused multiply-add operation. |

## Function details

### `pi`

```rss
fn pi() -> float
```

Returns the constant pi.

### `tau`

```rss
fn tau() -> float
```

Returns the constant tau.

### `e`

```rss
fn e() -> float
```

Returns Euler's number.

### `epsilon`

```rss
fn epsilon() -> float
```

Returns the machine epsilon for floating-point comparisons.

### `inf`

```rss
fn inf() -> float
```

Returns positive infinity.

### `neg_inf`

```rss
fn neg_inf() -> float
```

Returns negative infinity.

### `nan`

```rss
fn nan() -> float
```

Returns NaN.

### `abs`

```rss
fn abs(value: number) -> number
```

Returns the absolute value of a number.

### `sqrt`

```rss
fn sqrt(value: number) -> float
```

Returns the square root of a number.

### `cbrt`

```rss
fn cbrt(value: number) -> float
```

Returns the cube root of a number.

### `exp`

```rss
fn exp(value: number) -> float
```

Returns e raised to the given power.

### `exp2`

```rss
fn exp2(value: number) -> float
```

Returns 2 raised to the given power.

### `ln`

```rss
fn ln(value: number) -> float
```

Returns the natural logarithm of a number.

### `ln_1p`

```rss
fn ln_1p(value: number) -> float
```

Returns the natural logarithm of one plus a number.

### `log2`

```rss
fn log2(value: number) -> float
```

Returns the base-2 logarithm of a number.

### `log10`

```rss
fn log10(value: number) -> float
```

Returns the base-10 logarithm of a number.

### `sin`

```rss
fn sin(value: number) -> float
```

Returns the sine of an angle in radians.

### `cos`

```rss
fn cos(value: number) -> float
```

Returns the cosine of an angle in radians.

### `tan`

```rss
fn tan(value: number) -> float
```

Returns the tangent of an angle in radians.

### `asin`

```rss
fn asin(value: number) -> float
```

Returns the arcsine of a number.

### `acos`

```rss
fn acos(value: number) -> float
```

Returns the arccosine of a number.

### `atan`

```rss
fn atan(value: number) -> float
```

Returns the arctangent of a number.

### `sinh`

```rss
fn sinh(value: number) -> float
```

Returns the hyperbolic sine of a number.

### `cosh`

```rss
fn cosh(value: number) -> float
```

Returns the hyperbolic cosine of a number.

### `tanh`

```rss
fn tanh(value: number) -> float
```

Returns the hyperbolic tangent of a number.

### `floor`

```rss
fn floor(value: number) -> number
```

Rounds a number down to the nearest integer value.

### `ceil`

```rss
fn ceil(value: number) -> number
```

Rounds a number up to the nearest integer value.

### `round`

```rss
fn round(value: number) -> number
```

Rounds a number to the nearest integer value.

### `trunc`

```rss
fn trunc(value: number) -> number
```

Truncates the fractional part of a number.

### `fract`

```rss
fn fract(value: number) -> float
```

Returns the fractional part of a number.

### `signum`

```rss
fn signum(value: number) -> number
```

Returns the sign of a number.

### `to_degrees`

```rss
fn to_degrees(value: number) -> float
```

Converts radians to degrees.

### `to_radians`

```rss
fn to_radians(value: number) -> float
```

Converts degrees to radians.

### `is_nan`

```rss
fn is_nan(value: number) -> bool
```

Returns whether a number is NaN.

### `is_infinite`

```rss
fn is_infinite(value: number) -> bool
```

Returns whether a number is infinite.

### `is_finite`

```rss
fn is_finite(value: number) -> bool
```

Returns whether a number is finite.

### `atan2`

```rss
fn atan2(y: number, x: number) -> float
```

Returns the four-quadrant arctangent of two numbers.

### `powf`

```rss
fn powf(value: number, exponent: number) -> float
```

Raises a number to a floating-point power.

### `powi`

```rss
fn powi(value: number, exponent: int) -> float
```

Raises a number to an integer power.

### `hypot`

```rss
fn hypot(left: number, right: number) -> float
```

Returns the hypotenuse length for two numbers.

### `log`

```rss
fn log(value: number, base: number) -> float
```

Returns the logarithm of a number for the given base.

### `min`

```rss
fn min(left: number, right: number) -> number
```

Returns the smaller of two numbers.

### `max`

```rss
fn max(left: number, right: number) -> number
```

Returns the larger of two numbers.

### `copysign`

```rss
fn copysign(value: number, sign: number) -> float
```

Returns the first number with the sign of the second number.

### `clamp`

```rss
fn clamp(value: number, min: number, max: number) -> number
```

Clamps a number to an inclusive range.

### `mul_add`

```rss
fn mul_add(left: number, right: number, addend: number) -> float
```

Computes a fused multiply-add operation.
