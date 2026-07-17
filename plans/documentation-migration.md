# RustScript Documentation Migration Plan

**Goal:** Publish a central documentation set in `rustscript-lang/website` that separates user guides, language/reference material, and internal development material; then reduce each migrated project README to a short introduction, a verified quick start, and a documentation link.

**Architecture:** Add source Markdown under `content/docs/` and a deterministic `scripts/build-docs.mjs` generator that emits static `/docs/` pages during `bun run build`. Keep a checked-in source map that associates each documentation section with the README heading and repository revision from which its prose facts are derived. Code samples are copied only from tracked repository files, retain their source path and revision, and are executed or compiled before publication.

**Source boundary:** Narrative facts come from the top-level README files in `rustscript`, `pd-edge`, `pd-controller`, `flint`, `micro-rustscript`, and `IronRust`. RSS syntax and sample validity are verified against the current `rustscript` parser, compiler tests, standard-library examples, and executable `.rss` files. The language reference marks unfinished function-value support as development status and links only to verified behavior.

**Terminology:** Use established terms: RustScript, RSS, `pd-vm`, VMBC, host function, edge data plane, controller, runtime, compiler, interpreter, JIT, AOT, WebAssembly, `no_std`, CLR, function value, closure, and call frame. Do not create substitute product names or informal architecture labels.

---

## Content model

```
content/docs/
  index.md
  learn/
    getting-started.md
    rss-basics.md
    embed-pd-vm.md
    artifacts-and-debugging.md
    edge.md
    controller.md
    embedded.md
    clr.md
    flint.md
  reference/
    rss/
      index.md
      lexical-structure.md
      modules-and-imports.md
      bindings-and-types.md
      functions-and-closures.md
      expressions-and-control-flow.md
      collections-and-patterns.md
      operators-and-builtins.md
      function-values.md
    host-functions.md
    runtime-controls.md
  contribute/
    architecture.md
    vm-and-compiler.md
    edge-runtime.md
    controller.md
    embedded-runtime.md
    clr-runtime.md
    flint-runtime.md
  _meta/
    source-map.json
    terminology.md
```

Each generated page receives a breadcrumb, user/reference/contributor navigation, a canonical `/docs/.../` URL, and a source note when it contains derived operational detail. The site landing page links to `/docs/` without duplicating the full documentation tree.

## Task 1: Establish source inventory and documentation evidence

**Files:**
- Create: `website/content/docs/_meta/source-map.json`
- Create: `website/content/docs/_meta/terminology.md`
- Create: `website/content/docs/_meta/examples.json`
- Read only: top-level README files from the six source repositories

1. Record the exact Git revision for each source repository before extracting facts.
2. Create one source-map record per page section with `repository`, `revision`, `readme_path`, `heading`, and `scope` fields.
3. Create one example record per displayed snippet with `repository`, `revision`, `path`, `line_range`, `language`, `verification_command`, and `verification_result` fields.
4. Obtain `flint` at `/home/wow/rustscript/flint` from `https://github.com/rustscript-lang/flint.git`; record the cloned revision before using its README or examples.
5. Reject a draft paragraph that has no README source record and reject a code sample without a tracked source record plus a successful verification result.

**Verification:** a script checks that every page listed in the documentation index has at least one source-map entry, and every fenced code block declared executable has an example record.

## Task 2: Build a static documentation route

**Files:**
- Create: `website/scripts/build-docs.mjs`
- Modify: `website/package.json`
- Modify: `website/index.html`
- Create: `website/tests/docs-build.test.mjs`
- Create: `website/content/docs/index.md`

1. Add `build:docs` before the Vite build in `bun run build`.
2. Generate `/docs/index.html` and nested `/docs/<section>/<page>/index.html` pages from `content/docs/`.
3. Reuse the website header, theme control, stylesheet, and footer without touching unrelated homepage changes already present in the worktree.
4. Generate a table of contents from Markdown headings and route links from page metadata.
5. Add a homepage documentation link with the standard label `Documentation`.
6. Test that the build emits `/docs/`, links are relative to the deployment root, every generated route loads the shared theme asset, and no documentation URL points to a retired route.

**Verification:** `bun run test`, `bun run build`, a static-link scan of `dist/docs/`, and browser checks at desktop and 390 px widths.

## Task 3: Write user guides from README material

**Files:**
- Create: `website/content/docs/learn/*.md`

1. Write `getting-started.md` from the RustScript README quick-start material and include one executable RSS program sourced from `rustscript/examples/` or an existing compiler test.
2. Write `rss-basics.md` with `use`, host imports, bindings, functions, execution, and state examples sourced from current `.rss` files.
3. Write `embed-pd-vm.md` from RustScript crate-usage material and verify every Rust snippet in a temporary Cargo integration project using the current workspace dependency revision.
4. Write `artifacts-and-debugging.md` from VMBC, debugger, record/replay, fuel, epoch, WebAssembly, and `no_std` README sections. Keep internal implementation discussion out of this guide.
5. Write `edge.md`, `controller.md`, `embedded.md`, `clr.md`, and `flint.md` from their respective README files. Each guide starts with prerequisites, quick start, expected result, and links to its reference and contributor pages.

**Verification:** execute or compile every example using the command stored in `examples.json`; compare each quick-start command with the command in its source README.

## Task 4: Publish complete RSS reference material

**Files:**
- Create: `website/content/docs/reference/rss/*.md`
- Create: `website/tests/rss-reference-coverage.test.mjs`

1. Inventory accepted RSS syntax from the lexer, parser, IR, compiler tests, standard library, and real `.rss` examples. Record the source file and test or execution command for every syntax family.
2. Cover lexical structure: comments, identifiers, keywords, literals, strings, escapes, numeric forms, delimiters, and operators.
3. Cover modules and imports: `use`, aliases, named imports, wildcard imports, `self`, `super`, and restrictions.
4. Cover declarations and types: `let`, `let mut`, functions, structs, generics, parameters, return types, primitive types, inferred types, collections, and schemas supported by the parser.
5. Cover expressions and statements: blocks, calls, method/postfix expressions, assignment, `if`, `match`, `for`, `while`, ranges, `return`, `break`, `continue`, pipe closures, and expression result rules.
6. Cover collections and patterns with real accepted examples.
7. Cover host calls, built-ins, formatting, and error boundaries without presenting host-specific APIs as language syntax.
8. Add `function-values.md` as an explicit development-status reference. Describe the currently verified distinction between direct callable analysis and runtime function values; document only behavior proved by the current branch’s tests and characterization programs. Do not present function values as a released stable language feature.
9. Write a coverage test that checks every parser-recognized syntax family has one documented section and every code example declared valid has a verification record.

**Verification:** run the RSS samples through `pd-vm`, run the focused compiler tests that establish each grammar family, and fail the documentation coverage test for untracked sample blocks.

## Task 5: Write contributor documentation

**Files:**
- Create: `website/content/docs/contribute/*.md`

1. Write `architecture.md` to map RustScript, pd-edge, pd-controller, micro-rustscript, IronRust, and Flint responsibilities using the six README files.
2. Write `vm-and-compiler.md` from the RustScript README internals sections. Keep observable contracts separate from private implementation details.
3. Write runtime pages for pd-edge protocol/DAG processing, pd-controller orchestration, embedded targets and VMBC loading, CLR compilation, and Flint host/back-end integration.
4. Link every contributor page to the corresponding user guide and reference page, while keeping implementation paths and maintenance instructions out of the user guides.

**Verification:** source-map validation confirms every contributor statement is mapped to its repository README; link validation confirms no contributor-only page is required to complete a user quick start.

## Task 6: Migrate and simplify non-core project READMEs

**Files:**
- Modify: `pd-edge/README.md`
- Modify: `pd-controller/README.md`
- Modify: `micro-rustscript/README.md`
- Modify: `IronRust/README.md`
- Modify: `flint/README.md`

1. Run source-map completeness and example verification before deleting README sections.
2. Replace each README with exactly these content groups:
   - project name and one-paragraph introduction;
   - a verified quick start copied from the migrated guide;
   - a `Documentation` link to the matching page at `https://rustscript.org/docs/`.
3. Preserve the project’s conventional build or install command only when it is required for the quick start.
4. Do not change `rustscript/README.md`.
5. Do not remove a statement until the generated documentation contains an equivalent or more complete mapped section.

**Verification:** compare headings and source-map records before and after replacement; check that every removed README heading maps to at least one documentation page; execute each retained quick-start command.

## Task 7: Publish in dependency order

1. Run website unit tests, static build, generated-page link checks, and browser smoke checks.
2. Commit and push the website documentation scope first; verify the remote commit and the published `/docs/` route.
3. After `/docs/` is available, simplify each migrated project README in its own repository, run its focused quick-start verification, commit, and push immediately.
4. Verify the final remote README links resolve to the published pages.
5. Leave unrelated dirty files in `website`, `rustscript`, and every source repository outside the staged commits.

## Acceptance criteria

- `/docs/` provides separate user guides, RSS/reference pages, and contributor documentation.
- Every prose section maps to one of the six source README files and an exact revision.
- Every displayed executable snippet has a real repository path, revision, and successful verification command.
- RSS reference covers all syntax accepted by the current parser and identifies function values as development status until verified release behavior exists.
- The five non-core source project READMEs contain only an introduction, quick start, and documentation link after migration.
- `rustscript/README.md` remains unchanged.
- Website and each README repository are committed and pushed independently after their focused checks pass.
