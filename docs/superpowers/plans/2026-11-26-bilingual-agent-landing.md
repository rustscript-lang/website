# Bilingual RustScript Agent Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use codex-superpowers-subagent-driven-development (recommended) or codex-superpowers-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild agent.rustscript.org around the deck’s three-pillar story, replace the opaque RSS example with an effect lifecycle, and ship complete English and Chinese static homepages.

**Architecture:** Keep the dependency-free GitHub Pages site and its current design system. English remains `/index.html`; Chinese is a full `/zh/index.html` document sharing root assets. Existing progressive enhancement, event replay, accessibility, and animation discipline remain, while the architecture controls and final code panel become three-pillar and tool-graph interactions.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node built-in test runner, Browser/IAB, GitHub Pages.

**Spec:** `../rustscript-website/docs/superpowers/specs/2026-11-26-rustscript-agent-story-design.md`

## Global Constraints

- Preserve `CNAME` as exactly `agent.rustscript.org` and keep `.nojekyll`.
- Add no runtime dependencies, analytics, remote fonts, or remote media.
- English route is `/`; Chinese route is `/zh/`; neither route auto-redirects.
- Both languages must be fully useful without JavaScript.
- Keep technical identifiers literal and translate explanatory copy.
- Do not claim arbitrary external-effect reversal, gateway file-source admission pinning, or restart continuation of process-local terminal retry.
- Preserve keyboard access, live announcements, reduced motion, mobile layout, and visibility-aware particle scheduling.
- Do not omit spaces in code or prose.

## Review Focus

- Direct `/zh/` navigation with relative CSS/JS/image paths must render without 404s.
- English and Chinese documents must retain identical section IDs, interaction hooks, and outbound destinations.
- Narrow Chinese copy at 320 px must not overflow or clip controls.
- With JavaScript blocked, pillar anchors, file-write stages, graph states, navigation, and language switching must remain understandable.
- Upgrade/rollback controls must preserve run pins and announce the selected graph state without implying live runs change version.

---

### Task 1: Bilingual content contract

**Files:**
- Create: `tests/site-contract.test.mjs`
- Modify: `index.html`
- Create: `zh/index.html`

**Interfaces:**
- Produces: stable IDs `sandbox-gap`, `pillars`, `effect-sandbox`, `tool-graph`; shared hooks `.stage-tab[data-stage]`, `.graph-state-control[data-graph-state]`; reciprocal language links.

- [ ] **Step 1: Write failing contract tests**

Assert both documents exist, have correct `lang`, canonical/hreflang links, reciprocal language links, the four stable IDs, all three pillar labels, the file-write scenario, graph A/B/run-pin concepts, and no nested `Result<Option` policy example.

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-contract.test.mjs`
Expected: FAIL because `/zh/index.html` and the new narrative do not exist.

- [ ] **Step 3: Implement the English and Chinese static documents**

Keep the current visual shell and metadata structure. Replace the current four-stage architecture copy and RSS code section with the approved information architecture. Add localized title/description/Open Graph copy and reciprocal `hreflang` links.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/site-contract.test.mjs`
Expected: all cases pass.

- [ ] **Step 5: Commit**

Commit only `index.html`, `zh/index.html`, and `tests/site-contract.test.mjs` with `feat: add bilingual three-pillar agent story`.

### Task 2: Effect and graph interactions

**Files:**
- Modify: `script.js`
- Modify: `styles.css`
- Modify: `tests/site-contract.test.mjs`

**Interfaces:**
- Consumes: hooks from Task 1.
- Produces: `activateGraphState(state)` behavior for `upgrade` and `rollback`, accessible pressed/selected state, live run-pin status, and shared behavior on both routes.

- [ ] **Step 1: Add failing static/behavior contracts**

Assert the script recognizes both graph states, updates an `aria-live` status, uses buttons with explicit state, and retains current no-JS/reduced-motion/navigation/replay hooks.

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-contract.test.mjs`
Expected: FAIL on missing graph-state behavior.

- [ ] **Step 3: Implement graph-state interaction and responsive styling**

Use the same markup hooks in both languages. Upgrade shows Run α pinned to A and new Run β on B. Rollback shows existing runs unchanged and new Run γ on retained A at a later generation. Keep all states visible in no-JS mode.

- [ ] **Step 4: Run GREEN and syntax checks**

Run: `node --test tests/site-contract.test.mjs && node --check script.js && git diff --check`
Expected: all pass.

- [ ] **Step 5: Commit**

Commit `script.js`, `styles.css`, and test updates with `feat: demonstrate pinned tool graph evolution`.

### Task 3: Social assets and browser acceptance

**Files:**
- Modify: `og-image.svg`
- Modify: `og-image.png`
- Modify only if browser QA proves necessary: `index.html`, `zh/index.html`, `styles.css`, `script.js`, `tests/site-contract.test.mjs`

**Interfaces:**
- Produces: localized pages and a shared 1200×630 social image matching the new “beyond the sandbox” positioning.

- [ ] **Step 1: Update the social card source and raster output**

Keep the exact 1200×630 PNG contract and change the visible message to the approved three-pillar positioning without adding unverified claims.

- [ ] **Step 2: Run static verification**

Run Node contracts, JS syntax, image dimension validation, local-link validation, and `git diff --check`.

- [ ] **Step 3: Run Browser/IAB acceptance**

Verify `/` and `/zh/` at 1440 px, 390 px, and 320 px; language links; direct Chinese load; no-JS; reduced motion; keyboard pillar navigation; event replay; graph upgrade/rollback; live announcements; no console errors; no horizontal overflow.

- [ ] **Step 4: Capture and inspect screenshots**

Capture English desktop, Chinese desktop, Chinese 390 px, Chinese 320 px, no-JS, and graph rollback. Inspect every image for hierarchy, translation fit, clipping, readability, and retained visual quality.

- [ ] **Step 5: Commit QA fixes and assets**

Commit relevant source/assets with `fix: complete bilingual landing page QA`.

### Task 4: Review, publish, and live verification

**Files:** No planned source changes unless review or live validation finds a defect.

- [ ] **Step 1: Independent task review**

Review spec compliance and code quality against the exact candidate. Address every blocking finding and re-run affected checks.

- [ ] **Step 2: Push `gh-pages`**

Push without rewriting unrelated history. Verify the remote branch head equals the reviewed candidate.

- [ ] **Step 3: Monitor Pages CI**

Watch the exact deployment run to terminal success. If it fails, inspect the failing step, fix the root cause, push a new candidate, and monitor the replacement run.

- [ ] **Step 4: Verify live routes**

Read back `https://agent.rustscript.org/` and `https://agent.rustscript.org/zh/`, exercise the language switch and graph interaction, and verify the deployed source/head. If DNS still blocks public access, verify GitHub Pages backend bytes with the correct Host header and report the DNS prerequisite separately.
