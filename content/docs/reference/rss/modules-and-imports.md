<!-- docs-title: Modules, Imports, and Host Calls -->

File-backed programs can compose source modules, builtin namespaces, standard-library namespaces, and host namespaces through `use` declarations.

## Source module imports

A sibling `module.rss` file can be imported with a named item list.

```rss
// module.rss
pub fn add_one(value: int) -> int {
    value + 1
}

// main.rss
use module::{add_one};
add_one(41);
```

## Module aliases

`use self::module as alias;` binds the module as a namespace.

```rss
// module.rss
pub fn add(left: int, right: int) -> int {
    left + right
}

// main.rss
use self::module as calc;
calc::add(20, 22);
```

## Relative module paths

`self` selects the current directory and each leading `super` ascends one parent directory. Source imports are relative; `crate::` paths are not accepted.

```rss
use self::helpers::{increment};
use super::shared::{normalize};
let value = increment(normalize(41));
value;
```

## Named imports

Brace syntax imports selected public functions from a module. An item can receive a local alias with `as`.

```rss
use helpers::{increment as next, double};
let value = next(20);
double(value);
```

## Wildcard imports

`::*` imports every public function directly.

```rss
use helpers::*;
increment(20) + double(10);
```

## Builtin namespace imports

Builtin namespaces become callable after `use namespace;`.

```rss
use math;
use json;
let root = math::sqrt(81);
json::encode(root);
```

## Standard-library namespace imports

Standard-library modules use the same namespace-call syntax.

```rss
use stdlib::rss::strings;
let trimmed = strings::trim("  rss  ");
let replaced = strings::replace(trimmed.copy(), "rss", "RustScript");
replaced;
```

## Host namespace imports

A host namespace import makes registered functions available through `namespace::function(...)`.

```rss
use runtime;
runtime::log("service started");
runtime::metric("requests", 1);
```

## Host namespace aliases

`as` gives an imported host namespace a local name.

```rss
use runtime as rt;
rt::sleep(10);
rt::log("awake");
```

## Direct host imports

Named or wildcard host imports make functions directly callable when the embedding registry supplies them.

```rss
use runtime::{log, metric};
log("request complete");
metric("requests", 1);
```

## Public module surface

Only `pub fn` declarations form the callable source-module surface. Private helpers remain local to their file.

```rss
fn normalize(value: int) -> int {
    if value < 0 => { 0 } else => { value }
}
pub fn clamp_to_zero(value: int) -> int {
    normalize(value)
}
clamp_to_zero(-1);
```

## Formatted output

`print` and `println` accept Rust-style literal format strings with positional placeholders.

```rss
let language = "RustScript";
let version = 1;
print("{} {}", language, version);
println("{1}: {0}", "ready", language);
```

See [Builtins](../builtins/) and [Stdlibs](../stdlibs/) for the generated callable catalogs, and [Host functions](../../host-functions/) for embedding contracts.
