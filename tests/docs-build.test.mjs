import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { Window } from "happy-dom";

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

test("Use in Rust projects renders verified Rust and highlighted TOML", async () => {
  run("node", ["scripts/build-blog.mjs"]);
  run("node", ["scripts/build-docs.mjs"]);

  const html = await readFile(new URL("../public/docs/learn/embed-pd-vm/index.html", import.meta.url), "utf8");
  const window = new Window();
  window.document.write(html);

  assert.equal(window.document.querySelector("article h1")?.textContent, "Use in Rust projects");
  assert.equal(
    [...window.document.querySelectorAll('.docs-nav-item > a')]
      .find((link) => link.getAttribute("href") === "/docs/learn/embed-pd-vm/")?.textContent,
    "Use in Rust projects",
  );
  assert.equal(
    window.document.querySelector('a[href="/docs/learn/embed-pd-vm/"]')?.getAttribute("aria-current"),
    "page",
  );

  const rust = window.document.querySelector('code.language-rust');
  assert.ok(rust);
  assert.ok(rust.querySelector('.tok-kw'));
  assert.match(rust.textContent, /compile_source/);
  assert.match(rust.textContent, /Vm::new/);
  assert.match(rust.textContent, /VmStatus::Halted/);
  assert.match(rust.textContent, /Value::Int\(42\)/);

  const toml = window.document.querySelector('code.language-toml');
  assert.ok(toml);
  assert.ok(toml.querySelector('.tok-fn'));
  assert.ok(toml.querySelector('.tok-str'));
  assert.match(toml.textContent, /rustscript = "0\.22\.2"/);
  assert.match(toml.innerHTML, /<span class="tok-fn">rustscript<\/span>/);
  assert.match(toml.innerHTML, /<span class="tok-str">"0\.22\.2"<\/span>/);
  assert.doesNotMatch(html, /CompileSourceFileOptions::with_source_plugin/);
  assert.match(window.document.querySelector("article")?.textContent ?? "", /CompileSourceFileOptions/);
  assert.match(window.document.querySelector("article")?.textContent ?? "", /with_source_plugin\(\.\.\.\)/);

  window.close();
});

test("documentation generators highlight Rust and RustScript fences", async () => {
  run("node", ["scripts/build-blog.mjs"]);
  run("node", ["scripts/build-docs.mjs"]);

  const rustDocs = await readFile(new URL("../public/docs/reference/rustscript/development/index.html", import.meta.url), "utf8");
  assert.match(rustDocs, /<code class="language-rust"><span class="tok-kw">let<\/span> <span class="tok-kw">mut<\/span> vm/);

  const rustBlog = await readFile(new URL("../public/blog/v05-async-suspension/index.html", import.meta.url), "utf8");
  assert.match(rustBlog, /<code class="language-rust"><span class="tok-kw">enum<\/span> <span class="tok-type">CallOutcome<\/span>/);

  const rustScriptBlog = await readFile(new URL("../public/blog/e01-protocol-dag-and-session-reuse/index.html", import.meta.url), "utf8");
  assert.match(rustScriptBlog, /<code class="language-rustscript"><span class="tok-kw">use<\/span> http;/);
});

test("API reference covers every catalog entry and renders nested module navigation", async () => {
  run("node", ["scripts/generate-api-reference.mjs"]);
  const catalog = JSON.parse(await readFile(new URL("_meta/runtime-api.json", content), "utf8"));
  const builtinCount = catalog.builtins.modules.reduce((total, module) => total + module.functions.length, 0);
  const stdlibCount = catalog.stdlibs.modules.reduce((total, module) => total + module.functions.length, 0);
  assert.equal(builtinCount, 99);
  assert.equal(stdlibCount, 129);
  assert.deepEqual(catalog.stdlibs.modules.map(({ slug }) => slug), [
    "bytes", "collections", "io", "iter", "lrucache", "math", "parse", "path", "strings",
  ]);

  run("node", ["scripts/build-docs.mjs"]);
  for (const [section, modules] of [["builtins", catalog.builtins.modules], ["stdlibs", catalog.stdlibs.modules]]) {
    await access(new URL(`../public/docs/reference/rss/${section}/index.html`, import.meta.url));
    for (const module of modules) {
      const html = await readFile(new URL(`../public/docs/reference/rss/${section}/${module.slug}/index.html`, import.meta.url), "utf8");
      for (const callable of module.functions) {
        const anchor = callable.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        assert.ok(html.includes(`<h3 id="${anchor}"><code>${callable.name}</code></h3>`), `${section}/${module.slug} missing ${callable.name}`);
      }
    }
  }

  const globalHtml = await readFile(new URL("../public/docs/reference/rss/builtins/global/index.html", import.meta.url), "utf8");
  const window = new Window();
  window.document.write(globalHtml);
  const syntaxLink = [...window.document.querySelectorAll(".docs-nav-item > a")].find((link) => link.textContent === "Syntax Cheatsheet");
  assert.ok(syntaxLink);
  const syntaxChildren = [...syntaxLink.parentElement.children].find((element) => element.classList.contains("docs-nav-children"));
  const sectionItems = [...syntaxChildren.children];
  assert.deepEqual(sectionItems.map((item) => item.firstElementChild.textContent), ["Builtins", "Stdlibs"]);
  const builtinsChildren = [...sectionItems[0].children].find((element) => element.classList.contains("docs-nav-children"));
  assert.equal(builtinsChildren.firstElementChild.firstElementChild.textContent, "Global functions");
  assert.equal(builtinsChildren.firstElementChild.firstElementChild.getAttribute("aria-current"), "page");
  window.close();
});

test("IronRust documents the checked-in WinForms example and its implementation path", async () => {
  run("node", ["scripts/build-docs.mjs"]);

  const exampleHtml = await readFile(new URL("../public/docs/reference/ironrust/winforms-example/index.html", import.meta.url), "utf8");
  const exampleWindow = new Window();
  exampleWindow.document.write(exampleHtml);
  const exampleText = exampleWindow.document.body.textContent;
  for (const expected of [
    "examples/dotnet-typed-winforms.rss",
    "--profile winforms",
    "System::Windows::EventLoop",
    "Ui::BindClick",
    "Ui::BindDialog",
    "Ui::BindClosing",
    "Ui::Wait",
    "Ui::ShowDialog",
    "Ui::Close",
  ]) {
    assert.ok(exampleText.includes(expected), `WinForms guide missing ${expected}`);
  }
  exampleWindow.close();

  const internalsHtml = await readFile(new URL("../public/docs/reference/ironrust/internals/index.html", import.meta.url), "utf8");
  const window = new Window();
  window.document.write(internalsHtml);
  const internalsText = window.document.body.textContent;
  for (const expected of [
    "PdVmDotNetSourceCompiler",
    "PdVmNativeCompiler",
    "PdVmVmbcReader",
    "PdVmClrCompiler",
    "PdVmProgramBase",
    "IPdVmProgram",
    "PdVmAssemblyLoader",
    "PdVmExecution",
    "PdVmDotNetHost",
    "PdVmWinFormsDispatcher",
    "PdVmWinFormsEventLoop",
    "ConcurrentQueue",
    "AutoResetEvent",
  ]) {
    assert.ok(internalsText.includes(expected), `IronRust internals missing ${expected}`);
  }

  const ironRustLink = [...window.document.querySelectorAll(".docs-nav-item > a")]
    .find((link) => link.textContent === "IronRust");
  assert.ok(ironRustLink);
  const children = [...ironRustLink.parentElement.children]
    .find((element) => element.classList.contains("docs-nav-children"));
  assert.deepEqual(
    [...children.children].map((item) => item.firstElementChild.textContent),
    ["Compilation and packaging", "WinForms example", "Internals", "Operations"],
  );
  assert.equal(children.children[2].firstElementChild.getAttribute("aria-current"), "page");
  window.close();
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
  assert.match(fullDagHtml, /\.mermaid-expand\s*\{/);
  assert.match(fullDagHtml, /\.mermaid-lightbox\s*\{/);
  assert.match(fullDagHtml, /\.mermaid-lightbox-viewport\s*\{/);
  assert.doesNotMatch(fullDagHtml, /\.mermaid-controls\s*\{/);
  await access(new URL("../public/assets/mermaid.min.js", import.meta.url));
  await access(new URL("../public/assets/mermaid-init.js", import.meta.url));

  const generatedRoutes = JSON.parse(await readFile(new URL("../public/docs/routes.json", import.meta.url), "utf8"));
  assert.equal(generatedRoutes.some(({ title }) => /\breference\b/i.test(title)), false);

  const rssHtml = await readFile(new URL("../public/docs/reference/rss/index.html", import.meta.url), "utf8");
  assert.match(rssHtml, /<aside class="docs-sidebar">/);
  assert.match(rssHtml, /aria-label="Documentation navigation"/);
  assert.match(rssHtml, /href="\/docs\/reference\/rss\/" aria-current="page">Syntax Cheatsheet<\/a>/);
  assert.match(rssHtml, /<h1 id="syntax-cheatsheet">Syntax Cheatsheet<\/h1>/);
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
