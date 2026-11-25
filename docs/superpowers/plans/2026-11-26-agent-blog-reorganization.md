# RustScript Agent Blog Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use codex-superpowers-subagent-driven-development (recommended) or codex-superpowers-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the draft RustScript Agent article so a first-time reader understands the sandbox gap, typed contracts, recoverable effects, and versioned tool graphs before implementation details.

**Architecture:** Keep the article English and source-grounded. Reorder the article to match the COSCon deck, use the managed file-write lifecycle as the central example, replace the nested RSS sample with diagrams/tables, and move pre-v1 implementation limits to a clearly bounded final section. Update Draft PR #4 only and keep it unmerged.

**Tech Stack:** Markdown, Mermaid, existing website blog generator, Node built-in tests, Bun/Vite build, GitHub Draft PR.

**Spec:** `docs/superpowers/specs/2026-11-26-rustscript-agent-story-design.md`

## Global Constraints

- Article remains English.
- Draft PR #4 remains Draft, Open, and unmerged.
- Preserve current technical corrections: gateway file source is not admission-pinned; restart performs repair/reconciliation rather than resuming process-local terminal retry.
- Do not present arbitrary external effects as reversible.
- Do not invent RSS APIs or source examples.
- Use diagrams and tables instead of the existing nested `Result<Option<...>>` RSS example.
- Do not omit spaces in code or prose.

## Review Focus

- The sandbox comparison must acknowledge OS/container/MicroVM isolation without claiming the runtime replaces it.
- The write lifecycle must distinguish private durable work, publication, conflict, replay, and restore.
- Tool graph rollback must preserve existing run pins and activate a retained graph as a new generation for future runs.
- PermissionDiff and state migration must remain validation/management concepts, not guest self-authorization.
- The limits section must preserve the current gateway-source pinning, serial tools, single-state-file ownership, scheduler, and external-reversal boundaries.

---

### Task 1: Article structure contract

**Files:**
- Create: `tests/agent-blog.test.mjs`
- Modify: `content/blog/e02-rustscript-agent-runtime.md`

**Interfaces:**
- Produces: required headings and concepts consumed by the blog generator; no RSS fenced block in the article.

- [ ] **Step 1: Write the failing article test**

Assert the source contains the selected title and ordered sections for sandbox gap, Why RustScript, Effect Sandbox, file-write lifecycle, Tool Graph, recovery/publication, limits, and core claim. Assert `Result<Option` and fenced `rss` code are absent. Assert source-pinning and restart-repair caveats remain.

- [ ] **Step 2: Run RED**

Run: `node --test tests/agent-blog.test.mjs`
Expected: FAIL because the current article has the old title/order and RSS example.

- [ ] **Step 3: Rewrite the article**

Use concise prose, one sandbox comparison table, one file-write lifecycle, one CAS/conflict explanation, one run-pin/rollback diagram, and a bounded limitations section. Keep links to the landing page, repository, core docs, host ABI, and async suspension article.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/agent-blog.test.mjs`
Expected: all cases pass.

- [ ] **Step 5: Commit**

Commit article and test with `docs(blog): reorganize the agent runtime story`.

### Task 2: Generated-route and technical acceptance

**Files:**
- Modify only if verification proves necessary: `content/blog/e02-rustscript-agent-runtime.md`, `tests/agent-blog.test.mjs`

**Interfaces:**
- Produces: generated route `/blog/e02-rustscript-agent-runtime/` with rendered tables/diagrams and valid links.

- [ ] **Step 1: Run focused tests and blog build**

Run: `node --test tests/agent-blog.test.mjs` and `bun run build:blog`.
Expected: source tests pass and the route is generated.

- [ ] **Step 2: Inspect generated output**

Verify heading order, landing-page/repository/docs links, absence of the retired RSS example, and Mermaid/table markup in generated HTML.

- [ ] **Step 3: Run the production build in a sibling-complete layout**

Run the repository’s real `bun run build` and focused website tests using the available sibling repositories. Keep any missing-sibling prerequisite distinct from article failures.

- [ ] **Step 4: Source-grounded technical review**

Compare claims with the current rustscript-agent source/docs for effect lifecycle, private branches/publication, receipts/replay, restore, graph pins, activation/rollback, state migration, and limits. Correct every blocking finding.

- [ ] **Step 5: Commit verification fixes**

Commit only article/test changes with `docs(blog): align agent story with current runtime`.

### Task 3: Update Draft PR and monitor checks

**Files:** No planned source changes unless CI or review finds a defect.

- [ ] **Step 1: Rebase onto current `origin/main`**

Preserve the two original article commits and design/plan commits, incorporate current main (including the homepage agent link), and verify the resulting article/tree.

- [ ] **Step 2: Push with an exact force-with-lease**

Use the verified old remote head as the lease. Read back PR #4 head, Draft state, base, title, and changed files.

- [ ] **Step 3: Update PR title/body**

Reflect the new “Beyond the Agent Sandbox” structure and actual verification. Keep the explicit “Draft — do not merge” state.

- [ ] **Step 4: Monitor exact-head CI**

Watch every reported check/run to terminal status. If a check fails, inspect its exact failure, fix the root cause in the same branch, push, and monitor the replacement head.

- [ ] **Step 5: Verify publication preview without merging**

Inspect generated local route and any available PR preview. Confirm PR #4 remains Draft/Open/unmerged.
