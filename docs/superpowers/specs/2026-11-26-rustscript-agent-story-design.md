# RustScript Agent Story and Bilingual Homepage Design

## Intent

Reframe the RustScript Agent landing page and the draft rustscript.org article around the story established by the COSCon deck. The audience is a technically curious first-time visitor who understands agent sandboxes but may not know RustScript, durable effect protocols, or versioned tool graphs.

The page should first explain the problem in ordinary systems language, then expose the implementation model. A visitor should understand the product before seeing language syntax.

## Goals

- Make the distinction between infrastructure sandboxing and agent-runtime governance immediately clear.
- Organize both surfaces around three memorable pillars: Typed Contracts, Effect Sandbox, and Tool Graph.
- Make evolution and rollback concrete through run pinning, permission changes, and graph generations.
- Replace the current nested `Result<Option<...>>` homepage example with a visual file-write lifecycle that requires no RustScript knowledge.
- Provide complete English and Chinese homepage variants with a visible language switch.
- Preserve the current dark editorial visual system, responsive behavior, reduced-motion support, no-JavaScript usability, and existing accessibility baseline.
- Keep the article technically precise about current pre-v1 limits, including the gateway file-source pinning gap and restart-repair behavior.

## Non-goals

- Editing the COSCon presentation.
- Translating the blog article into Chinese in this change.
- Claiming that arbitrary external effects can be reversed.
- Claiming that gateway file-selected agent source is pinned at durable admission.
- Redesigning rustscript.org itself beyond the already-merged project link.
- Adding a frontend framework, build dependency, analytics, or remote assets to the dependency-free GitHub Pages site.

## Anti-goals

- Leading with syntax or nested generic types.
- Presenting a generic “LLM loop” as the product architecture.
- Hiding current limitations behind marketing language.
- Making Chinese a JavaScript-only translation that disappears without scripts.
- Duplicating visible content while allowing the English and Chinese information architecture to drift.

## Approaches Considered

### 1. Three-pillar product narrative — selected

Lead with the gap left after OS/container/MicroVM isolation, then explain Typed Contracts, Effect Sandbox, and Tool Graph. Use a concrete file-write lifecycle inside the Effect Sandbox section.

This mirrors the deck, makes the product thesis memorable, and retains enough implementation depth for runtime engineers.

### 2. File-write demonstration as the entire page

Tell every section through `write_file("race.txt", "first")`, including private view, CAS conflict, receipt replay, restore, and graph upgrade.

This is highly concrete but narrows the perceived product to filesystem transactions and makes typed contracts and graph evolution feel secondary.

### 3. RustScript-language-first narrative

Start from Type Metadata, Resource ownership, Host ABI, and VM lifecycle, then derive the agent runtime.

This serves language-runtime specialists but delays the product value for the conference and agent-platform audience.

## Homepage Information Architecture

### 1. Hero — beyond the sandbox

Core message:

> A sandbox limits where an agent can run. RustScript Agent governs what each action means, what it may change, and how it can recover.

The existing animated lifecycle remains, but labels should summarize the product story rather than expose internal transition names too early.

### 2. The missing runtime layer

A compact comparison distinguishes:

- OS policy / container / MicroVM: process, filesystem, network, and kernel isolation.
- RustScript Agent: typed calls, admitted authority, receipts, private state, publication, recovery, and tool-version capture.

This section should answer why another layer is needed after a sandbox exists.

### 3. Three pillars

The current four-stage architecture control becomes three audience-facing pillars:

1. **Typed Contracts** — Type, Resource ownership, and Host ABI describe a tool call before it runs.
2. **Effect Sandbox** — Contract → Grant → Token → Receipt binds proposal, authority, execution, and result.
3. **Tool Graph** — Candidate → Validate → Activate; each run captures one immutable graph generation.

The controls remain progressively enhanced tabs on desktop and ordinary anchor-linked sections without JavaScript.

### 4. One action, fully accounted for

Replace the RSS policy code window with a visual walkthrough of:

`write_file("race.txt", "first")`

Stages:

1. Write into a private managed view; the published head remains unchanged.
2. Freeze the candidate tree and canonical result.
3. Commit receipt, new head, result, and event through the expected-head transition.
4. Read back the durable decision.
5. On conflict, keep the candidate and report the mismatch; on restore, create a new branch/run with fresh authority.

Visible copy must state that arbitrary external systems require their own reconciliation contracts.

### 5. Tool evolution without rewriting live runs

Add a clear generation timeline:

- Run α captures Graph A.
- Graph B passes validation and permission diff, then becomes active.
- Run α continues on A; new Run β captures B.
- Rollback selects retained Graph A as a new generation; new Run γ captures A.

A small interaction may switch between upgrade and rollback states. It must work with keyboard controls, reduced motion, and a complete static fallback.

### 6. Limits and calls to action

Keep current pre-v1 limits concise and link to the detailed article, documentation, and repository. The closing message should join all three pillars: evolve policy and tools while preserving authority, receipts, and run pins.

## Language Architecture

- English remains at `/`.
- Chinese is a real static document at `/zh/`.
- Header and footer expose reciprocal `EN` / `中文` links.
- Each page has its own `<html lang>`, localized title, description, Open Graph metadata, canonical URL, and reciprocal `hreflang` entries.
- Both documents share `styles.css`, `script.js`, and static assets.
- No automatic locale redirect. The visitor’s explicit URL remains authoritative and shareable.
- No-JavaScript mode remains fully readable in both languages.
- Tests verify the same section IDs, controls, dynamic data attributes, external destinations, and required concepts in both documents.
- Technical identifiers such as `write_file`, `run.admitted`, Graph A/B, receipt IDs, and event names remain literal; explanatory copy is localized.

## Blog Reorganization

Working title:

**Beyond the Agent Sandbox: Typed Contracts, Recoverable Effects, and Versioned Tool Graphs**

Proposed order:

1. What process sandboxes solve—and what they leave open.
2. Why RustScript: typed contracts, host-controlled I/O, and controlled execution.
3. The Effect Sandbox: call context and Contract → Grant → Token → Receipt.
4. A complete file-write example: private view, prepare, commit/readback, CAS conflict, replay, and restore.
5. Tool Graph evolution: closed candidates, permission diff, activation, run pins, rollback, and state migration.
6. Durable recovery and publication boundaries.
7. Current tradeoffs and limits.
8. The core claim: the model proposes actions; the runtime governs their typed authority, durable outcome, and versioned implementation.

The existing nested RSS review example is removed. Diagrams and state tables carry the explanation. Any remaining source-shaped fragment must be short, source-grounded, and understandable without prior RustScript knowledge.

## Interaction and Accessibility

- Preserve semantic headings, landmarks, visible focus, keyboard navigation, reduced motion, and live status announcements.
- Language selection uses normal links and never depends on JavaScript.
- Interactive graph controls expose button state and announce the selected generation/run mapping.
- The private-view walkthrough remains understandable as ordered text when CSS or JavaScript is unavailable.
- Particle animation remains suspended when hidden, off-screen, on narrow viewports, or under reduced motion.

## Verification

### Landing page

- Static HTML/link/content validation for both `/` and `/zh/`.
- JavaScript syntax and regression checks.
- Browser verification at 1440 px, 390 px, and 320 px.
- English/Chinese language switching, direct `/zh/` loading, no-JavaScript, reduced motion, keyboard navigation, and screen-reader roles.
- Interaction checks for the three pillars, effect walkthrough, event replay, and graph upgrade/rollback.
- No horizontal overflow and no clipped translated copy.
- Current RustScript/agent technical claims checked against repository source and tests.

### Blog

- Source-grounded review against the current rustscript-agent implementation.
- Website focused tests and production build.
- Generated route inspection, heading order, internal/external links, and Mermaid rendering where used.
- Draft PR remains open and unmerged.

## Delivery

- Landing page changes continue on `rustscript-agent` branch `gh-pages` and publish through GitHub Pages.
- Blog changes update website Draft PR #4 and remain unmerged.
- The existing rustscript.org homepage project link remains unchanged.
