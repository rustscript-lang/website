import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { execFileSync } from "node:child_process";

const root = new URL("..", import.meta.url);
const content = new URL("../content/docs/", import.meta.url);
const examples = JSON.parse(await readFile(new URL("_meta/examples.json", content), "utf8"));

const completeReadmePages = [
  { repository: "rustscript", revision: "9a4509b162fe4500fe91180f3e2ea9d0230df304", page: "reference/rustscript.md" },
  { repository: "pd-edge", revision: "3468170^", page: "reference/pd-edge.md" },
  { repository: "pd-controller", revision: "d02e12a^", page: "reference/pd-controller.md" },
  { repository: "micro-rustscript", revision: "6cafab2^", page: "reference/micro-rustscript.md" },
  { repository: "IronRust", revision: "769aea7^", page: "reference/ironrust.md" },
  { repository: "flint", revision: "a8d1711^", page: "reference/flint.md" },
];

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: "pipe" });
}

test("primary project documentation preserves every README byte", async () => {
  for (const { repository, revision, page } of completeReadmePages) {
    const original = execFileSync("git", ["show", `${revision}:README.md`], {
      cwd: new URL(`../${repository}/`, root),
      encoding: "utf8",
    });
    const documentation = await readFile(new URL(page, content), "utf8");
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
    "docs/reference/pd-edge/full-dag/index.html",
    "docs/reference/rustscript/index.html",
    "docs/contribute/architecture/index.html",
  ]) {
    const html = await readFile(new URL(`../public/${route}`, import.meta.url), "utf8");
    assert.match(html, /assets\/site\.css/);
    assert.match(html, /Documentation/);
  }
  const generatedRoutes = JSON.parse(await readFile(new URL("../public/docs/routes.json", import.meta.url), "utf8"));
  assert.equal(generatedRoutes.some(({ title }) => /\breference\b/i.test(title)), false);

  const rssHtml = await readFile(new URL("../public/docs/reference/rss/index.html", import.meta.url), "utf8");
  assert.match(rssHtml, /<aside class="docs-sidebar">/);
  assert.match(rssHtml, /aria-label="Documentation navigation"/);
  assert.match(rssHtml, /href="\/docs\/reference\/rss\/" aria-current="page"/);
  assert.match(rssHtml, /<h2>Ecosystem<\/h2>/);
  assert.match(rssHtml, /href="\/docs\/reference\/pd-edge\/">pd-edge<\/a><a href="\/docs\/reference\/pd-edge\/full-dag\/">Full DAG Graphs<\/a>/);
  assert.doesNotMatch(rssHtml, />[^<]*reference<\/h1>/i);
  assert.match(rssHtml, /<table class="docs-table">/);
  assert.match(rssHtml, /<span class="tok-kw">use<\/span>/);
  assert.doesNotMatch(rssHtml, /<p>\| Form \| Meaning \|/);
  assert.doesNotMatch(rssHtml, /Source:|Documentation sources|revision [0-9a-f]{40}/);
  await assert.rejects(access(new URL("../public/docs/reference/function-values/index.html", import.meta.url)));
  await assert.rejects(access(new URL("../public/docs/reference/readmes/index.html", import.meta.url)));
  await assert.rejects(access(new URL("../public/docs/sources/index.html", import.meta.url)));
});
