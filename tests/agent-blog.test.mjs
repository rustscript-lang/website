import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const article = await readFile(
  new URL("../content/blog/e02-rustscript-agent-runtime.md", import.meta.url),
  "utf8",
);

const title = "# Beyond the Agent Sandbox: Typed Contracts, Recoverable Effects, and Versioned Tool Graphs";
const orderedSections = [
  "## What a Process Sandbox Solves—and What It Leaves Open",
  "## Why RustScript: Typed Contracts at the Host Boundary",
  "## The Effect Sandbox: From Proposal to Receipt",
  "## One File Write, Fully Accounted For",
  "## Tool Graphs That Evolve Without Rewriting Live Runs",
  "## Recovery and Publication Are Separate Boundaries",
  "## Current Tradeoffs and Limits",
  "## The Core Claim",
];

test("agent article follows the approved sandbox-to-tool-graph narrative", () => {
  assert.equal(article.startsWith(`${title}\n`), true);

  let previous = article.indexOf(title);
  for (const heading of orderedSections) {
    const current = article.indexOf(heading);
    assert.notEqual(current, -1, `missing heading: ${heading}`);
    assert.ok(current > previous, `heading out of order: ${heading}`);
    previous = current;
  }

  assert.match(article, /OS policy[\s\S]*container[\s\S]*MicroVM/i);
  assert.match(article, /Contract → Grant → Token → Receipt/);
  assert.match(article, /write_file\("race\.txt", "first"\)/);
  assert.match(article, /PermissionDiff/);
  assert.match(article, /state migration/i);
});

test("agent article removes the nested RSS review example", () => {
  assert.doesNotMatch(article, /Result<Option/);
  assert.doesNotMatch(article, /```(?:rss|rustscript)\b/i);
});

test("agent article preserves the current recovery and source-pinning limits", () => {
  assert.match(article, /file-selected agent source[^.]*not (?:durably |admission-)?pinned/i);
  assert.match(
    article,
    /restart[^.]*repair[^.]*reconcil[^.]*rather than resum[^.]*process-local terminal/i,
  );
  assert.match(article, /arbitrary external effects[^.]*cannot be reversed/i);
  assert.match(article, /Tool dispatch is serial/i);
  assert.match(article, /One process owns one SQLite state file/i);
  assert.match(article, /There is no durable scheduler/i);
});
