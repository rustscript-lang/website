import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const contentRoot = new URL("../content/", import.meta.url);

async function collectMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) return collectMarkdown(url);
    if (!entry.name.endsWith(".md")) return [];
    return [await readFile(url, "utf8")];
  }));
  return files.flat();
}

test("published content describes the current callable and callback runtime", async () => {
  const combined = (await collectMarkdown(contentRoot)).join("\n");
  assert.doesNotMatch(combined, /functions are currently inlined, not first-class/i);
  assert.doesNotMatch(combined, /no recursive calls/i);
  assert.doesNotMatch(combined, /no storing functions in collections/i);
  assert.doesNotMatch(combined, /callable-development-status/i);
  assert.doesNotMatch(combined, /function value[^\n]*active development/i);

  const terminology = await readFile(new URL("../content/docs/terminology.md", import.meta.url), "utf8");
  const contributor = await readFile(new URL("../content/docs/contribute/vm-and-compiler.md", import.meta.url), "utf8");
  const stackArticle = await readFile(new URL("../content/blog/v01-why-stack-and-local-slots.md", import.meta.url), "utf8");
  const hostArticle = await readFile(new URL("../content/blog/v06-host-function-abi.md", import.meta.url), "utf8");

  assert.match(terminology, /first-class callable runtime value/);
  assert.match(terminology, /typed host-facing handle/);
  assert.match(contributor, /real script call frames/);
  assert.match(stackArticle, /pushes a real frame/);
  assert.match(hostArticle, /typed `ScriptCallback`/);
});
