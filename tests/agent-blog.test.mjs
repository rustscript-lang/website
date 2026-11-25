import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, cp, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Window } from "happy-dom";

const root = fileURLToPath(new URL("..", import.meta.url));
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

function section(markdown, heading) {
  const start = markdown.indexOf(heading);
  assert.notEqual(start, -1, `missing section: ${heading}`);
  const next = markdown.indexOf("\n## ", start + heading.length);
  return markdown.slice(start, next === -1 ? markdown.length : next);
}

function assertSemantic(scope, concepts) {
  for (const [name, alternatives] of Object.entries(concepts)) {
    assert.ok(
      alternatives.some((pattern) => pattern.test(scope)),
      `missing semantic guard: ${name}`,
    );
  }
}

function generatedTarget(tempRoot, route, href) {
  const target = new URL(href, `https://rustscript.org${route}`);
  let relative = target.pathname.replace(/^\//, "");
  if (target.pathname.endsWith("/")) relative = path.join(relative, "index.html");
  return path.join(tempRoot, "public", relative);
}

test("agent article follows the approved sandbox-to-tool-graph narrative", () => {
  assert.equal(article.startsWith(`${title}\n`), true);

  let previous = article.indexOf(title);
  for (const heading of orderedSections) {
    const current = article.indexOf(heading);
    assert.notEqual(current, -1, `missing heading: ${heading}`);
    assert.ok(current > previous, `heading out of order: ${heading}`);
    previous = current;
  }

  assert.doesNotMatch(article, /Result<Option/);
  assert.doesNotMatch(article, /```(?:rss|rustscript)\b/i);
});

test("sandbox section separates file confinement from process and OS isolation", () => {
  const scope = section(article, orderedSections[0]);
  assertSemantic(scope, {
    "file paths stay within the admitted workspace": [
      /file(?:system)? paths?[^.]*admitted workspace/i,
      /file(?: and process)? tools?[^.]*beneath[^.]*workspace/i,
    ],
    "managed processes retain owner cwd and environment constraints": [
      /process(?:es)?[^.]*owner[^.]*working director(?:y|ies)[^.]*environment/i,
      /process tools?[^.]*owner[^.]*cwd[^.]*environment/i,
    ],
    "spawned processes are not chrooted": [
      /(?:spawned|child) process(?:es)?[^.]*not chrooted/i,
      /no chroot[^.]*process/i,
    ],
    "host path and network access depend on deployment policy": [
      /host (?:path|filesystem)[^.]*network[^.]*(?:OS|container|deployment) policy/i,
      /(?:OS|container) policy[^.]*host (?:path|filesystem)[^.]*network/i,
    ],
  });
});

test("file lifecycle section preserves private publication and replay semantics", () => {
  const scope = section(article, orderedSections[3]);
  assertSemantic(scope, {
    "private state remains distinct from publication": [
      /private[^.]*published (?:pointer|head)[^.]*remain/i,
      /private durability[^.]*public visibility[^.]*separate/i,
    ],
    "receipt head result and events commit atomically": [
      /(?:receipt|result)[^.]*(?:branch head|new head)[^.]*(?:events?|messages?)[^.]*commit together/i,
      /commit[^.]*(?:receipt|canonical result)[^.]*(?:branch head|new head)[^.]*(?:events?|messages?)[^.]*atomically/i,
    ],
    "the committed decision is read back before success": [
      /read(?:s|ing)? (?:back )?the durable decision[^.]*before reporting success/i,
      /lost acknowledgement[^.]*replay[^.]*stored result/i,
    ],
    "CAS conflict retains the losing candidate": [
      /(?:CAS|compare-and-swap|expected head)[^.]*conflict[^.]*candidate[^.]*retain/i,
      /candidate[^.]*retain[^.]*(?:CAS|compare-and-swap|head conflict)/i,
    ],
    "replay returns the durable result without another effect": [
      /replay[^.]*stored result[^.]*(?:without|rather than)[^.]*running[^.]*again/i,
      /reads? (?:its )?receipt[^.]*(?:rather than|without)[^.]*performing[^.]*again/i,
    ],
  });
});

test("restore scope selects frozen runtime state and fresh authority", () => {
  const scope = section(article, orderedSections[3]);
  assertSemantic(scope, {
    "checkpoint freezes managed tree and history": [
      /checkpoint[^.]*frozen managed (?:file-)?tree[^.]*history/i,
      /checkpoint[^.]*managed (?:file-)?tree root[^.]*history prefix/i,
    ],
    "checkpoint captures graph and public execution config": [
      /captured (?:tool )?graph (?:reference|pin)[^.]*public execution config/i,
      /checkpoint[^.]*(?:tool )?graph (?:reference|pin)[^.]*execution config/i,
    ],
    "plugin state coverage is explicitly supported": [
      /supported plugin-state (?:coverage|roots?)/i,
      /plugin-state roots? supported by the checkpoint/i,
    ],
    "external boundaries remain separate facts": [
      /external (?:high-water|boundary)[^.]*separate/i,
      /separate external (?:high-water|boundary) facts?/i,
    ],
    "restore issues fresh authority and uses selected graph config": [
      /restore[^.]*fresh (?:native )?authority[^.]*(?:checkpoint-selected|captured) graph[^.]*config/i,
      /restor(?:e|ing)[^.]*(?:checkpoint-selected|captured) graph[^.]*config[^.]*fresh (?:native )?authority/i,
    ],
  });
});

test("tool graph section keeps management non-authorizing and generations monotonic", () => {
  const scope = section(article, orderedSections[4]);
  assertSemantic(scope, {
    "PermissionDiff is review data": [
      /PermissionDiff[^.]*review data only/i,
      /PermissionDiff[^.]*reports?[^.]*review/i,
    ],
    "PermissionDiff cannot authorize activation": [
      /neither[^.]*authorizes? activation/i,
      /PermissionDiff[^.]*does not authorize activation/i,
    ],
    "migration is pure and effect-free": [
      /pure migration[^.]*no (?:direct or delegated )?effects/i,
      /migration program[^.]*pure[^.]*effect-free/i,
    ],
    "graph generations never move backward": [
      /generation[^.]*never moves? backward/i,
      /monotonic graph generation/i,
    ],
    "live run pins survive activation and rollback": [
      /existing runs?[^.]*never rewritten/i,
      /Run α stays on A[^.]*Run β stays on B/i,
    ],
  });
});

test("recovery section separates live shutdown from durable startup repair", () => {
  const scope = section(article, orderedSections[5]);
  assertSemantic(scope, {
    "graceful live shutdown revokes and reaps owned process-local objects": [
      /(?:graceful )?(?:live )?(?:stop|shutdown)[^.]*revoke[^.]*(?:tokens?|capabilities?)[^.]*reap[^.]*(?:children|processes)/i,
      /revoke[^.]*(?:tokens?|capabilities?)[^.]*reap[^.]*(?:children|processes)[^.]*graceful (?:stop|shutdown)/i,
    ],
    "process termination discards local maps and tables": [
      /process termination[^.]*(?:token maps?|process tables?)[^.]*gone/i,
      /(?:token maps?|process tables?)[^.]*disappear[^.]*process (?:exit|termination)/i,
    ],
    "startup repairs durable records": [
      /startup[^.]*repairs?[^.]*(?:durable )?run[^.]*(?:effect )?records/i,
      /startup[^.]*reconcil[^.]*(?:durable )?(?:run|effect) records/i,
    ],
    "startup cannot promise external process termination": [
      /startup[^.]*does not guarantee[^.]*terminat[^.]*surviving external processes/i,
      /surviving external processes[^.]*no startup[^.]*termination guarantee/i,
    ],
  });
  assert.doesNotMatch(scope, /startup[^.]*interrupts?[^.]*(?:open tokens?|owned children)/i);
});

test("limits section preserves source pinning restart and process boundaries", () => {
  const limits = section(article, orderedSections[6]);
  assertSemantic(limits, {
    "gateway file source remains unpinned at durable admission": [
      /file-selected agent source[^.]*not (?:durably |admission-)?pinned/i,
    ],
    "restart does not resume process-local retry state": [
      /restart[^.]*does not resume process-local retry state/i,
      /restart[^.]*repair[^.]*rather than resum[^.]*process-local/i,
    ],
    "external effects are not universally reversible": [
      /arbitrary external effects[^.]*cannot be reversed/i,
    ],
    "tool calls remain serial": [/Tool dispatch is serial/i],
    "state file has one process owner": [/One process owns one SQLite state file/i],
    "scheduler is not durable": [/There is no durable scheduler/i],
    "deployment isolation owns kernel boundaries": [
      /Application confinement[^.]*deployment isolation/i,
      /OS policy[^.]*kernel and tenant boundaries/i,
    ],
  });
});

test("generated agent route renders the accepted structure and resolves local references", async (t) => {
  const tempRoot = await mkdtemp(path.join(process.env.TMPDIR ?? os.tmpdir(), "agent-blog-route-"));
  t.after(async () => rm(tempRoot, { recursive: true, force: true }));

  await Promise.all([
    cp(path.join(root, "scripts"), path.join(tempRoot, "scripts"), { recursive: true }),
    cp(path.join(root, "src"), path.join(tempRoot, "src"), { recursive: true }),
    cp(path.join(root, "content", "blog"), path.join(tempRoot, "content", "blog"), { recursive: true }),
    cp(path.join(root, "content", "docs"), path.join(tempRoot, "content", "docs"), { recursive: true }),
    symlink(path.join(root, "node_modules"), path.join(tempRoot, "node_modules"), "dir"),
  ]);

  execFileSync(process.execPath, ["scripts/build-blog.mjs"], { cwd: tempRoot, stdio: "pipe" });
  execFileSync(process.execPath, ["scripts/build-docs.mjs"], { cwd: tempRoot, stdio: "pipe" });

  const route = "/blog/e02-rustscript-agent-runtime/";
  const html = await readFile(path.join(tempRoot, "public", "blog", "e02-rustscript-agent-runtime", "index.html"), "utf8");
  const window = new Window({ url: `https://rustscript.org${route}` });
  window.document.write(html);

  const headings = [...window.document.querySelectorAll("article h1, article h2")]
    .map((heading) => `${heading.tagName} ${heading.textContent.trim()}`);
  assert.deepEqual(headings.slice(0, orderedSections.length + 1), [
    `H1 ${title.slice(2)}`,
    ...orderedSections.map((heading) => `H2 ${heading.slice(3)}`),
  ]);
  assert.ok(window.document.querySelectorAll("article .doc-table-wrap table").length >= 5);
  assert.equal(window.document.querySelector("article pre code.language-rss, article pre code.language-rustscript"), null);
  assert.doesNotMatch(window.document.querySelector("article")?.textContent ?? "", /Result<Option/);

  const links = [
    ["RustScript core documentation", "/docs/reference/rustscript/"],
    ["Host Function ABI", "/blog/v06-host-function-abi/"],
    ["Async Suspension Without Coroutines", "/blog/v05-async-suspension/"],
  ];
  for (const [label, expectedPath] of links) {
    const link = [...window.document.querySelectorAll("article a")]
      .find((candidate) => candidate.textContent.trim() === label);
    assert.ok(link, `missing generated link: ${label}`);
    const resolved = new URL(link.getAttribute("href"), `https://rustscript.org${route}`);
    assert.equal(resolved.pathname, expectedPath, label);
    await access(generatedTarget(tempRoot, route, link.getAttribute("href")));
  }

  window.close();
});
