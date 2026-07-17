import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { execFileSync } from "node:child_process";

const root = new URL("..", import.meta.url);
const content = new URL("../content/docs/", import.meta.url);
const sourceMap = JSON.parse(await readFile(new URL("_meta/source-map.json", content), "utf8"));
const migrationMap = JSON.parse(await readFile(new URL("_meta/migration-map.json", content), "utf8"));
const examples = JSON.parse(await readFile(new URL("_meta/examples.json", content), "utf8"));

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: "pipe" });
}

test("documentation source map names every documentation repository", () => {
  assert.deepEqual(
    sourceMap.sources.map((source) => source.repository).sort(),
    ["IronRust", "flint", "micro-rustscript", "pd-controller", "pd-edge", "rustscript"].sort(),
  );
  for (const source of sourceMap.sources) {
    assert.match(source.revision, /^[0-9a-f]{40}$/);
    assert.ok(source.pages.length > 0);
  }
});

test("every migrated README heading has an existing documentation destination", async () => {
  for (const [repository, migration] of Object.entries(migrationMap.repositories)) {
    assert.ok(migration.headings.length > 0, `${repository} must record its pre-cleanup headings`);
    assert.ok(migration.pages.length > 0, `${repository} must have destination pages`);
    for (const page of migration.pages) {
      await access(new URL(`${page}.md`, content));
    }
  }
});

test("migrated project READMEs retain only introduction, quick start, and documentation links", async () => {
  for (const repository of Object.keys(migrationMap.repositories)) {
    const readme = await readFile(new URL(`../${repository}/README.md`, root), "utf8");
    const headings = [...readme.matchAll(/^#{1,3}\s+(.+)$/gm)].map((match) => match[1]);
    assert.deepEqual(headings.slice(1), ["Quick start", "Documentation"], repository);
    assert.match(readme, /https:\/\/rustscript\.org\/docs\//, repository);
  }
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
    "docs/reference/function-values/index.html",
    "docs/contribute/architecture/index.html",
    "docs/sources/index.html",
  ]) {
    const html = await readFile(new URL(`../public/${route}`, import.meta.url), "utf8");
    assert.match(html, /assets\/site\.css/);
    assert.match(html, /Documentation/);
  }
  const rssHtml = await readFile(new URL("../public/docs/reference/rss/index.html", import.meta.url), "utf8");
  assert.match(rssHtml, /<table class="docs-table">/);
  assert.doesNotMatch(rssHtml, /<p>\| Form \| Meaning \|/);
});
