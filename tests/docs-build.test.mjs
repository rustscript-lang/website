import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { execFileSync } from "node:child_process";

const root = new URL("..", import.meta.url);
const content = new URL("../content/docs/", import.meta.url);
const examples = JSON.parse(await readFile(new URL("_meta/examples.json", content), "utf8"));

const projectDocumentationBundles = [
  {
    repository: "rustscript",
    revision: "f1a6c3d",
    pages: ["reference/rustscript.md", "reference/rustscript/development.md", "reference/rustscript/internals.md"],
  },
  {
    repository: "pd-edge",
    revision: "3468170^",
    pages: ["reference/pd-edge.md", "reference/pd-edge/operations.md", "reference/pd-edge/layered-dags.md", "reference/pd-edge/distribution.md"],
  },
  { repository: "pd-controller", revision: "d02e12a^", pages: ["reference/pd-controller.md"] },
  {
    repository: "micro-rustscript",
    revision: "6cafab2^",
    pages: ["reference/micro-rustscript.md", "reference/micro-rustscript/firmware-and-development.md"],
  },
  {
    repository: "IronRust",
    revision: "769aea7^",
    pages: ["reference/ironrust.md", "reference/ironrust/compilation-and-packaging.md", "reference/ironrust/operations.md"],
  },
  {
    repository: "flint",
    revision: "a8d1711^",
    pages: ["reference/flint.md", "reference/flint/cli-and-execution.md", "reference/flint/host-functions.md"],
  },
];

function stripDocsTitle(markdown) {
  return markdown.replace(/^<!-- docs-title: .+ -->\n\n/, "");
}

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: "pipe" });
}

test("project documentation bundles preserve every README byte", async () => {
  for (const { repository, revision, pages } of projectDocumentationBundles) {
    const original = execFileSync("git", ["show", `${revision}:README.md`], {
      cwd: new URL(`../${repository}/`, root),
      encoding: "utf8",
    });
    const documentation = (await Promise.all(
      pages.map(async (page) => stripDocsTitle(await readFile(new URL(page, content), "utf8"))),
    )).join("");
    assert.equal(documentation, original, repository);
  }
});

test("pd-edge Full DAG Graphs preserve the moved markdown byte-for-byte", async () => {
  const original = execFileSync("git", ["show", "3468170:docs/full-dag.md"], {
    cwd: new URL("../pd-edge/", root),
    encoding: "utf8",
  });
  const documentation = await readFile(new URL("reference/pd-edge/full-dag.md", content), "utf8");
  assert.equal(documentation, original);
});

test("documentation examples are tracked source files with recorded successful verification", async () => {
  for (const example of examples.examples) {
    assert.equal(example.result.includes("passed"), true);
    assert.ok(example.verification.length > 0);
    const repository = example.repository === "rustscript"
      ? "../rustscript/"
      : `../${example.repository}/`;
    await access(new URL(`${repository}${example.path}`, root));
  }
});

test("documentation generator emits the main routes", async () => {
  run("node", ["scripts/build-docs.mjs"]);
  for (const route of [
    "docs/index.html",
    "docs/learn/getting-started/index.html",
    "docs/reference/rss/index.html",
    "docs/reference/pd-edge/index.html",
    "docs/reference/pd-edge/operations/index.html",
    "docs/reference/pd-edge/full-dag/index.html",
    "docs/reference/rustscript/index.html",
    "docs/reference/rustscript/development/index.html",
    "docs/contribute/architecture/index.html",
  ]) {
    const html = await readFile(new URL(`../public/${route}`, import.meta.url), "utf8");
    assert.match(html, /assets\/site\.css/);
    assert.match(html, /Documentation/);
  }
  const fullDagHtml = await readFile(new URL("../public/docs/reference/pd-edge/full-dag/index.html", import.meta.url), "utf8");
  assert.match(fullDagHtml, /<div class="mermaid" role="img" aria-label="Mermaid diagram">[\s\S]*flowchart LR/);
  assert.match(fullDagHtml, /<script defer src="\/assets\/mermaid\.min\.js"><\/script>/);
  assert.match(fullDagHtml, /<script defer src="\/assets\/mermaid-init\.js"><\/script>/);
  await access(new URL("../public/assets/mermaid.min.js", import.meta.url));
  await access(new URL("../public/assets/mermaid-init.js", import.meta.url));

  const generatedRoutes = JSON.parse(await readFile(new URL("../public/docs/routes.json", import.meta.url), "utf8"));
  assert.equal(generatedRoutes.some(({ title }) => /\breference\b/i.test(title)), false);

  const rssHtml = await readFile(new URL("../public/docs/reference/rss/index.html", import.meta.url), "utf8");
  assert.match(rssHtml, /<aside class="docs-sidebar">/);
  assert.match(rssHtml, /aria-label="Documentation navigation"/);
  assert.match(rssHtml, /href="\/docs\/reference\/rss\/" aria-current="page"/);
  assert.match(rssHtml, /<h2>Getting Started<\/h2>/);
  assert.doesNotMatch(rssHtml, /<h2>Learn<\/h2>/);
  assert.match(rssHtml, /<h2>Ecosystem<\/h2>/);
  assert.match(rssHtml, /<div class="docs-nav-item"><a href="\/docs\/reference\/pd-edge\/">pd-edge<\/a><div class="docs-nav-children">[\s\S]*href="\/docs\/reference\/pd-edge\/full-dag\/">Full DAG Graphs<\/a>/);
  assert.match(rssHtml, /<div class="docs-nav-item"><a href="\/docs\/reference\/rustscript\/">RustScript<\/a><div class="docs-nav-children">[\s\S]*href="\/docs\/reference\/rustscript\/development\/">Development and tooling<\/a>/);
  assert.doesNotMatch(rssHtml, />[^<]*reference<\/h1>/i);
  assert.match(rssHtml, /<table class="docs-table">/);
  assert.match(rssHtml, /<span class="tok-kw">use<\/span>/);
  assert.doesNotMatch(rssHtml, /<p>\| Form \| Meaning \|/);
  assert.doesNotMatch(rssHtml, /Source:|Documentation sources|revision [0-9a-f]{40}/);
  await assert.rejects(access(new URL("../public/docs/reference/function-values/index.html", import.meta.url)));
  await assert.rejects(access(new URL("../public/docs/reference/readmes/index.html", import.meta.url)));
  await assert.rejects(access(new URL("../public/docs/sources/index.html", import.meta.url)));
});
