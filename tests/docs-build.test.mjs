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

// Website bundle pages keep the source README prose byte-for-byte, but
// repo-relative links that only resolve inside the source repository are
// rewritten to absolute URLs (or the site's own migrated page) so they work
// on the deployed site. This table is the migration contract for those
// rewrites; keep it in sync with the canonical pages when editing bundles.
const repoLinkFixes = {
  "pd-edge": [
    ["[`src/abi_impl/http/state.rs`](src/abi_impl/http/state.rs)", "[`src/abi_impl/http/state.rs`](https://github.com/rustscript-lang/pd-edge/blob/master/src/abi_impl/http/state.rs)"],
    ["[`src/abi_impl/http1/mod.rs`](src/abi_impl/http1/mod.rs)", "[`src/abi_impl/http/outbound_http1.rs`](https://github.com/rustscript-lang/pd-edge/blob/master/src/abi_impl/http/outbound_http1.rs)"],
    ["[`src/abi_impl/http2/mod.rs`](src/abi_impl/http2/mod.rs)", "[`src/abi_impl/http2/mod.rs`](https://github.com/rustscript-lang/pd-edge/blob/master/src/abi_impl/http2/mod.rs)"],
    ["[`src/abi_impl/transport/state.rs`](src/abi_impl/transport/state.rs)", "[`src/abi_impl/transport/state.rs`](https://github.com/rustscript-lang/pd-edge/blob/master/src/abi_impl/transport/state.rs)"],
    ["[`src/abi_impl/transport/udp.rs`](src/abi_impl/transport/udp.rs)", "[`src/abi_impl/transport/udp.rs`](https://github.com/rustscript-lang/pd-edge/blob/master/src/abi_impl/transport/udp.rs)"],
    ["[`src/abi_impl/websocket/state.rs`](src/abi_impl/websocket/state.rs)", "[`src/abi_impl/websocket/state.rs`](https://github.com/rustscript-lang/pd-edge/blob/master/src/abi_impl/websocket/state.rs)"],
    ["[`src/abi_impl/mqtt/`](src/abi_impl/mqtt/)", "[`src/abi_impl/mqtt/`](https://github.com/rustscript-lang/pd-edge/tree/master/src/abi_impl/mqtt/)"],
    ["[`src/abi_impl/webrtc/mod.rs`](src/abi_impl/webrtc/mod.rs)", "[`src/abi_impl/webrtc/mod.rs`](https://github.com/rustscript-lang/pd-edge/blob/master/src/abi_impl/webrtc/mod.rs)"],
    ["[`docs/full-dag.md`](docs/full-dag.md)", "[`Full DAG Graphs`](../full-dag/)"],
    ["[`src/abi_impl/transport/`](src/abi_impl/transport/)", "[`src/abi_impl/transport/`](https://github.com/rustscript-lang/pd-edge/tree/master/src/abi_impl/transport/)"],
    ["[`src/abi_impl/http/helpers.rs`](src/abi_impl/http/helpers.rs)", "[`src/abi_impl/http/helpers.rs`](https://github.com/rustscript-lang/pd-edge/blob/master/src/abi_impl/http/helpers.rs)"],
    ["[`src/abi_impl/http/`](src/abi_impl/http/)", "[`src/abi_impl/http/`](https://github.com/rustscript-lang/pd-edge/tree/master/src/abi_impl/http/)"],
    ["[`src/abi_impl/websocket/`](src/abi_impl/websocket/)", "[`src/abi_impl/websocket/`](https://github.com/rustscript-lang/pd-edge/tree/master/src/abi_impl/websocket/)"],
    ["[`src/abi_impl/webrtc/`](src/abi_impl/webrtc/)", "[`src/abi_impl/webrtc/`](https://github.com/rustscript-lang/pd-edge/tree/master/src/abi_impl/webrtc/)"],
    ["[`src/runtime/http_plane/proxy_path.rs`](src/runtime/http_plane/proxy_path.rs)", "[`src/runtime/http_plane/proxy_path.rs`](https://github.com/rustscript-lang/pd-edge/blob/master/src/runtime/http_plane/proxy_path.rs)"],
    ["[`pd-edge-abi/abi.json`](../pd-edge-abi/abi.json)", "[`pd-edge-abi/abi.json`](https://github.com/rustscript-lang/pd-edge/blob/master/pd-edge-abi/abi.json)"],
    ["[`docs/HTTP_PROXY_PERF_REPORT_2026-03-14.md`](docs/HTTP_PROXY_PERF_REPORT_2026-03-14.md)", "[`docs/HTTP_PROXY_PERF_REPORT_2026-03-14.md`](https://github.com/rustscript-lang/pd-edge/blob/master/docs/HTTP_PROXY_PERF_REPORT_2026-03-14.md)"],
    ["[`docs/HTTP_PROXY_PERF_REPORT_2026-03-15.md`](docs/HTTP_PROXY_PERF_REPORT_2026-03-15.md)", "[`docs/HTTP_PROXY_PERF_REPORT_2026-03-15.md`](https://github.com/rustscript-lang/pd-edge/blob/master/docs/HTTP_PROXY_PERF_REPORT_2026-03-15.md)"],
  ],
  "pd-controller": [
    ["![pd-controller edge overview](screenshots/edge.jpg)", "![pd-controller edge overview](https://raw.githubusercontent.com/rustscript-lang/pd-controller/master/screenshots/edge.jpg)"],
    ["![pd-controller program management](screenshots/program.jpg)", "![pd-controller program management](https://raw.githubusercontent.com/rustscript-lang/pd-controller/master/screenshots/program.jpg)"],
    ["![pd-controller debugger](screenshots/debugger.jpg)", "![pd-controller debugger](https://raw.githubusercontent.com/rustscript-lang/pd-controller/master/screenshots/debugger.jpg)"],
  ],
  "micro-rustscript": [
    ["[Framework API reference](docs/framework-api.md)", "[Framework API reference](https://github.com/rustscript-lang/micro-rustscript/blob/master/docs/framework-api.md)"],
  ],
  "flint": [
    ["[Examples](https://github.com/rustscript-lang/flint/tree/main/examples)", "[Examples](https://github.com/rustscript-lang/flint/tree/master/examples)"],
    ["[RustScript model programs](https://github.com/rustscript-lang/flint/tree/main/scripts)", "[RustScript model programs](https://github.com/rustscript-lang/flint/tree/master/scripts)"],
  ],
};

function applyRepoLinkFixes(markdown, repository) {
  for (const [from, to] of repoLinkFixes[repository] ?? []) {
    markdown = markdown.replaceAll(from, to);
  }
  return markdown;
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
    assert.equal(applyRepoLinkFixes(original, repository), documentation, repository);
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

test("documentation sidebar expands every top-level group and only the current branch path", async () => {
  run("node", ["scripts/build-blog.mjs"]);
  run("node", ["scripts/build-docs.mjs"]);

  const cases = [
    {
      route: "../public/docs/index.html",
      openBranches: [],
      active: "RustScript Documentation",
    },
    {
      route: "../public/docs/learn/embed-pd-vm/index.html",
      openBranches: [],
      active: "Use in Rust projects",
    },
    {
      route: "../public/docs/reference/rss/builtins/global/index.html",
      openBranches: ["Syntax Cheatsheet", "Builtins"],
      active: "Global functions",
    },
    {
      route: "../public/docs/reference/ironrust/internals/index.html",
      openBranches: ["IronRust"],
      active: "Internals",
    },
  ];

  for (const expected of cases) {
    const html = await readFile(new URL(expected.route, import.meta.url), "utf8");
    const window = new Window();
    window.document.write(html);

    const groups = [...window.document.querySelectorAll("details.docs-nav-section")];
    assert.deepEqual(groups.map((group) => group.firstElementChild.textContent.trim()), [
      "Getting Started", "Reference", "Ecosystem", "Contribute", "About",
    ]);
    assert.deepEqual(
      groups.filter((group) => group.hasAttribute("open")).map((group) => group.firstElementChild.textContent.trim()),
      ["Getting Started", "Reference", "Ecosystem", "Contribute", "About"],
    );
    assert.deepEqual(
      [...window.document.querySelectorAll("details.docs-nav-branch[open] > summary > a")]
        .map((link) => link.textContent.trim()),
      expected.openBranches,
    );
    assert.equal(window.document.querySelector('[aria-current="page"]')?.textContent.trim(), expected.active);
    window.close();
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

  const rustDocs = await readFile(new URL("../public/docs/reference/rustscript/vm-api/index.html", import.meta.url), "utf8");
  assert.match(rustDocs, /<code class="language-rust"><span class="tok-kw">let<\/span> <span class="tok-kw">mut<\/span> vm/);

  const rustBlog = await readFile(new URL("../public/blog/v05-async-suspension/index.html", import.meta.url), "utf8");
  assert.match(rustBlog, /<code class="language-rust"><span class="tok-kw">enum<\/span> <span class="tok-type">CallOutcome<\/span>/);

  const rustScriptBlog = await readFile(new URL("../public/blog/e01-protocol-dag-and-session-reuse/index.html", import.meta.url), "utf8");
  assert.match(rustScriptBlog, /<code class="language-rustscript"><span class="tok-kw">use<\/span> http;/);
});

test("RustScript project documentation is split by task and implementation area", async () => {
  run("node", ["scripts/build-docs.mjs"]);

  const overviewHtml = await readFile(new URL("../public/docs/reference/rustscript/index.html", import.meta.url), "utf8");
  const overviewWindow = new Window();
  overviewWindow.document.write(overviewHtml);
  const cratesBadge = overviewWindow.document.querySelector('article img[alt="rustscript on crates.io"]');
  assert.ok(cratesBadge);
  assert.equal(cratesBadge.getAttribute("src"), "https://img.shields.io/crates/v/rustscript.svg");
  assert.equal(cratesBadge.closest("a")?.getAttribute("href"), "https://crates.io/crates/rustscript");
  assert.doesNotMatch(overviewWindow.document.querySelector("article")?.textContent ?? "", /\]\(https:\/\/crates\.io\/crates\/rustscript\)/);
  overviewWindow.close();

  const expectedPages = [
    ["pd-vm-run", "pd-vm-run"],
    ["debugger", "Debugger"],
    ["cooperative-scheduling", "Cooperative Scheduling"],
    ["playground", "Playground"],
    ["bytecode", "Bytecode"],
    ["vm-api", "VM API"],
    ["compiler", "Compiler"],
    ["jit-aot", "JIT and AOT"],
  ];
  const rendered = new Map();
  for (const [slug, title] of expectedPages) {
    const html = await readFile(new URL(`../public/docs/reference/rustscript/${slug}/index.html`, import.meta.url), "utf8");
    assert.match(html, new RegExp(`<h1[^>]*>${title}<\\/h1>`));
    rendered.set(slug, html);
  }

  assert.match(rendered.get("pd-vm-run"), /<p>Download <code>pd-vm-run<\/code> from <a href="https:\/\/github\.com\/rustscript-lang\/rustscript\/releases"[^>]*>/);
  assert.doesNotMatch([...rendered.values()].join("\n"), /cargo run/);
  assert.match(rendered.get("debugger"), /--debug --tcp/);
  assert.match(rendered.get("cooperative-scheduling"), /set_fuel/);
  assert.match(rendered.get("cooperative-scheduling"), /set_epoch_deadline/);
  assert.match(rendered.get("playground"), /https:\/\/playground\.rustscript\.org\//);
  assert.match(rendered.get("playground"), /lint_source_json/);
  assert.match(rendered.get("playground"), /run_source_json/);
  assert.match(rendered.get("bytecode"), /Program/);
  assert.match(rendered.get("bytecode"), /OpCode/);
  assert.match(rendered.get("vm-api"), /<h2 id="api-reference">API Reference<\/h2>/);
  assert.match(rendered.get("vm-api"), /<h3 id="construction-and-program-ownership">Construction and program ownership<\/h3>/);
  assert.match(rendered.get("vm-api"), /<h3 id="execution-lifecycle">Execution lifecycle<\/h3>/);
  assert.match(rendered.get("compiler"), /Frontend-independent IR/);
  assert.match(rendered.get("compiler"), /lowering/);
  assert.match(rendered.get("jit-aot"), /Trace JIT/);
  assert.match(rendered.get("jit-aot"), /NYI/);

  const hostFunctions = await readFile(new URL("../public/docs/reference/host-functions/index.html", import.meta.url), "utf8");
  assert.match(hostFunctions, /HostFunctionDescriptor/);
  assert.match(hostFunctions, /HostModuleDescriptor/);
  assert.match(hostFunctions, /ResourceRef/);
  assert.match(hostFunctions, /ResourceMut/);
  assert.match(hostFunctions, /ResourceOwned/);
  assert.match(hostFunctions, /HostStateMut/);
  assert.match(hostFunctions, /HostNamedStruct/);
  assert.match(hostFunctions, /Compatibility window/);
  assert.match(hostFunctions, /HostApiBuilder/);
  assert.match(rendered.get("vm-api"), /RegexCacheVmExt/);
  assert.doesNotMatch(rendered.get("vm-api"), /Each VM also owns an LRU cache/);
  assert.match(hostFunctions, /Generated <code>#\[pd_host_function\]<\/code> binding selection/);
  await assert.rejects(access(new URL("../public/docs/reference/rustscript/development/index.html", import.meta.url)));
  await assert.rejects(access(new URL("../public/docs/reference/rustscript/internals/index.html", import.meta.url)));

  const window = new Window();
  window.document.write(rendered.get("vm-api"));
  const rustScriptLink = [...window.document.querySelectorAll(".docs-nav-item a")]
    .find((link) => link.textContent === "RustScript");
  const rustScriptBranch = rustScriptLink.closest("details.docs-nav-branch");
  const children = [...rustScriptBranch.children]
    .find((element) => element.classList.contains("docs-nav-children"));
  assert.deepEqual(
    [...children.children].map((item) => item.firstElementChild.textContent),
    expectedPages.map(([, title]) => title),
  );
  window.close();
});

test("published host-function pages describe per-VM host state and catalog fingerprints", async () => {
  run("node", ["scripts/build-docs.mjs"]);

  const hostWindow = new Window();
  hostWindow.document.write(await readFile(new URL("../public/docs/reference/host-functions/index.html", import.meta.url), "utf8"));
  const hostText = hostWindow.document.querySelector("article")?.textContent ?? "";
  assert.match(hostText, /Per-VM dependencies that guests must never see/);
  assert.match(hostText, /HostState::initialize\(\)/);
  assert.match(hostText, /HostContext::set_host_state/);
  assert.match(hostText, /never appear in the schema, catalog fingerprint, or VMBC/);
  assert.match(hostText, /survives Vm::reset_for_reuse/);
  assert.match(hostText, /drops with the VM/);
  assert.match(hostText, /borrow guard/);
  assert.match(hostText, /do not carry a lifecycle or initializer/);
  assert.match(hostText, /resource declarations/);
  assert.match(hostText, /deny-by-default/);
  assert.match(hostText, /HostFunctionRegistry::restricted/);
  assert.doesNotMatch(hostText, /per[- ]scope/i);
  assert.doesNotMatch(hostText, /required initializer|required or lazy default|the only fingerprint input/i);
  hostWindow.close();

  const terminologyWindow = new Window();
  terminologyWindow.document.write(await readFile(new URL("../public/docs/terminology/index.html", import.meta.url), "utf8"));
  const terminologyText = terminologyWindow.document.querySelector("article")?.textContent ?? "";
  assert.match(terminologyText, /Per-VM host-private state/);
  assert.match(terminologyText, /catalog fingerprint/);
  assert.match(terminologyText, /VMBC/);
  assert.match(terminologyText, /reset_for_reuse/);
  assert.match(terminologyText, /drops with the VM/);
  assert.doesNotMatch(terminologyText, /per[- ]scope/i);
  terminologyWindow.close();

  const vmWindow = new Window();
  vmWindow.document.write(await readFile(new URL("../public/docs/reference/rustscript/vm-api/index.html", import.meta.url), "utf8"));
  const vmText = vmWindow.document.querySelector("article")?.textContent ?? "";
  assert.match(vmText, /hidden per-VM host state/);
  assert.match(vmText, /RegexCacheVmExt/);
  assert.match(vmText, /survives Vm::reset_for_reuse/);
  assert.match(vmText, /never appears in guest arity, schema, catalog fingerprint, or VMBC/);
  vmWindow.close();
});

test("Syntax Cheatsheet is split into complete highlighted RSS topic pages", async () => {
  run("node", ["scripts/build-docs.mjs"]);
  const topics = [
    ["primitive-types", "Primitive Types and Literals"],
    ["type-inference", "Type Inference and Annotations"],
    ["bindings-and-ownership", "Bindings, Mutability, and Ownership"],
    ["collections-and-structs", "Collections, Structs, and Optional Values"],
    ["expressions-and-operators", "Expressions and Operators"],
    ["control-flow", "Control Flow and Pattern Matching"],
    ["functions-and-generics", "Functions, Generics, and Recursion"],
    ["callables-and-closures", "Callables and Closures"],
    ["modules-and-imports", "Modules, Imports, and Host Calls"],
    ["lexical-structure", "Lexical Structure"],
  ];
  const rendered = [];
  const renderedText = [];
  for (const [slug, title] of topics) {
    const html = await readFile(new URL(`../public/docs/reference/rss/${slug}/index.html`, import.meta.url), "utf8");
    const window = new Window();
    window.document.write(html);
    const article = window.document.querySelector("article");
    assert.equal(article.querySelector("h1")?.textContent, title);
    const sections = [...article.querySelectorAll("h2")];
    assert.ok(sections.length > 0, `${slug} must contain syntax sections`);
    for (const section of sections) {
      let cursor = section.nextElementSibling;
      let example = null;
      while (cursor && cursor.tagName !== "H2") {
        example ||= cursor.matches("pre")
          ? cursor.querySelector("code.language-rss")
          : cursor.querySelector?.("code.language-rss");
        cursor = cursor.nextElementSibling;
      }
      assert.ok(example, `${slug}#${section.id} must contain an RSS example`);
      assert.ok(example.querySelector('[class^="tok-"]'), `${slug}#${section.id} must be syntax highlighted`);
    }
    rendered.push(html);
    renderedText.push(article.textContent);
    window.close();
  }

  const combined = rendered.join("\n");
  const combinedText = renderedText.join("\n");
  assert.doesNotMatch(combinedText, /under active development|still under development|remain under active development/i);
  assert.match(combinedText, /fn\(int\) -> int/);
  assert.match(combinedText, /let int_identity: fn\(int\) -> int = identity/);
  assert.match(combinedText, /for \(key: string, value: int\) in &values/);
  assert.match(combinedText, /Some\(value\)/);
  assert.match(combinedText, /\.copy\(\)/);
  assert.ok(combined.includes("language-rss"));
  const lexicalHtml = rendered.at(-1);
  assert.match(lexicalHtml, /<span class="tok-comment">\/\*[\s\S]*?\*\/<\/span>/);
  assert.match(lexicalHtml, /<span class="tok-str">'RustScript'<\/span>/);
  assert.match(lexicalHtml, /<span class="tok-str">b&quot;RSS\\x00&quot;<\/span>/);
  assert.match(lexicalHtml, /<span class="tok-num">0x2A<\/span>/);

  const overview = await readFile(new URL("../public/docs/reference/rss/index.html", import.meta.url), "utf8");
  const window = new Window();
  window.document.write(overview);
  const syntaxLink = [...window.document.querySelectorAll(".docs-nav-item a")]
    .find((link) => link.textContent === "Syntax Cheatsheet");
  const syntaxBranch = syntaxLink.closest("details.docs-nav-branch");
  const children = [...syntaxBranch.querySelector(":scope > .docs-nav-children").children]
    .map((item) => item.firstElementChild.textContent);
  assert.deepEqual(children, [...topics.map(([, title]) => title), "Builtins", "Stdlibs"]);
  for (const [slug, title] of topics) {
    assert.match(overview, new RegExp(`href="\\./${slug}/">${title}<\\/a>`));
  }
  window.close();
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
  const syntaxLink = [...window.document.querySelectorAll(".docs-nav-item a")].find((link) => link.textContent === "Syntax Cheatsheet");
  assert.ok(syntaxLink);
  const syntaxBranch = syntaxLink.closest("details.docs-nav-branch");
  const syntaxChildren = [...syntaxBranch.children].find((element) => element.classList.contains("docs-nav-children"));
  const sectionItems = [...syntaxChildren.children];
  assert.deepEqual(sectionItems.slice(-2).map((item) => item.firstElementChild.textContent), ["Builtins", "Stdlibs"]);
  const builtinsChildren = [...sectionItems.at(-2).children].find((element) => element.classList.contains("docs-nav-children"));
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
    "fn on_open() -> null",
    "fn on_close() -> null",
    "Ui::BindClick(form, open_item, || on_open())",
    "Ui::BindClosing(form, || on_close())",
    "Ui::Show(form)",
    "Ui::ShowDialog",
    "Ui::Close",
  ]) {
    assert.ok(exampleText.includes(expected), `WinForms guide missing ${expected}`);
  }
  for (const retired of ["PdVmWinFormsDispatcher", "Ui::Wait(", "Ui::WaitTimeout(", "action string"]) {
    assert.equal(exampleText.includes(retired), false, `WinForms guide still contains ${retired}`);
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
    "IPdVmCallableProgram",
    "PdVmScriptCallback",
    "PdVmWinFormsApplication",
    "PdVmWinFormsEventLoop",
    "ControlSynchronizationContext",
    "RunMessageLoop",
  ]) {
    assert.ok(internalsText.includes(expected), `IronRust internals missing ${expected}`);
  }
  for (const retired of ["PdVmWinFormsDispatcher", "Ui::Wait", "Ui::WaitTimeout", "AutoResetEvent"]) {
    assert.equal(internalsText.includes(retired), false, `IronRust internals still contains ${retired}`);
  }

  const ironRustLink = [...window.document.querySelectorAll(".docs-nav-item a")]
    .find((link) => link.textContent === "IronRust");
  assert.ok(ironRustLink);
  const ironRustBranch = ironRustLink.closest("details.docs-nav-branch");
  const children = [...ironRustBranch.children]
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
    "docs/reference/rss/primitive-types/index.html",
    "docs/reference/rss/type-inference/index.html",
    "docs/reference/rss/bindings-and-ownership/index.html",
    "docs/reference/rss/collections-and-structs/index.html",
    "docs/reference/rss/expressions-and-operators/index.html",
    "docs/reference/rss/control-flow/index.html",
    "docs/reference/rss/functions-and-generics/index.html",
    "docs/reference/rss/callables-and-closures/index.html",
    "docs/reference/rss/modules-and-imports/index.html",
    "docs/reference/rss/lexical-structure/index.html",
    "docs/reference/pd-edge/index.html",
    "docs/reference/pd-edge/operations/index.html",
    "docs/reference/pd-edge/full-dag/index.html",
    "docs/reference/rustscript/index.html",
    "docs/reference/rustscript/pd-vm-run/index.html",
    "docs/reference/rustscript/debugger/index.html",
    "docs/reference/rustscript/cooperative-scheduling/index.html",
    "docs/reference/rustscript/playground/index.html",
    "docs/reference/rustscript/bytecode/index.html",
    "docs/reference/rustscript/vm-api/index.html",
    "docs/reference/rustscript/compiler/index.html",
    "docs/reference/rustscript/jit-aot/index.html",
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
  assert.match(rssHtml, /<details class="docs-nav-section" open><summary>Getting Started<\/summary>/);
  assert.doesNotMatch(rssHtml, /<summary>Learn<\/summary>/);
  assert.match(rssHtml, /<details class="docs-nav-section" open><summary>Ecosystem<\/summary>/);
  assert.match(rssHtml, /<details class="docs-nav-item docs-nav-branch"><summary><a href="\/docs\/reference\/pd-edge\/">pd-edge<\/a><\/summary><div class="docs-nav-children">[\s\S]*href="\/docs\/reference\/pd-edge\/full-dag\/">Full DAG Graphs<\/a>/);
  assert.match(rssHtml, /<details class="docs-nav-item docs-nav-branch"><summary><a href="\/docs\/reference\/rustscript\/">RustScript<\/a><\/summary><div class="docs-nav-children">[\s\S]*href="\/docs\/reference\/rustscript\/pd-vm-run\/">pd-vm-run<\/a>[\s\S]*href="\/docs\/reference\/rustscript\/jit-aot\/">JIT and AOT<\/a>/);
  assert.match(rssHtml, /\.doc-shell\.docs-page h1 \{[^}]*font-size: clamp\(1\.5rem, 3vw, 2\.8rem\);/);
  assert.match(rssHtml, /\.doc-shell\.docs-page h2 \{[^}]*font-size: clamp\(1\.35rem, 2vw, 1\.5rem\);/);
  assert.match(rssHtml, /\.doc-shell\.docs-page h3 \{[^}]*font-size: 1\.2rem;/);
  assert.match(rssHtml, /\.doc-shell\.docs-page :not\(pre\) > code \{[^}]*overflow-wrap: anywhere;[^}]*white-space: normal;/);
  assert.match(rssHtml, /\.docs-nav-section > summary \{[^}]*padding: 0\.42rem 0\.62rem 0\.42rem 0\.25rem;/);
  assert.match(rssHtml, /\.docs-nav-item > a, \.docs-nav-branch > summary > a \{[^}]*padding-left: 1\.35rem;/);
  assert.match(rssHtml, /\.docs-nav-branch > summary::before \{[^}]*position: absolute;[^}]*left: 0\.45rem;/);
  assert.match(rssHtml, /\.docs-nav-children \{[^}]*margin: 0\.05rem 0 0\.2rem 0\.65rem;[^}]*padding-left: 0\.25rem;/);
  assert.doesNotMatch(rssHtml, />[^<]*reference<\/h1>/i);
  const primitiveHtml = await readFile(new URL("../public/docs/reference/rss/primitive-types/index.html", import.meta.url), "utf8");
  const modulesHtml = await readFile(new URL("../public/docs/reference/rss/modules-and-imports/index.html", import.meta.url), "utf8");
  assert.match(primitiveHtml, /<table class="docs-table">/);
  assert.match(modulesHtml, /<span class="tok-kw">use<\/span>/);
  assert.doesNotMatch(rssHtml, /<p>\| Form \| Meaning \|/);
  assert.doesNotMatch(rssHtml, /Source:|Documentation sources|revision [0-9a-f]{40}/);
  await assert.rejects(access(new URL("../public/docs/reference/function-values/index.html", import.meta.url)));
  await assert.rejects(access(new URL("../public/docs/reference/readmes/index.html", import.meta.url)));
  await assert.rejects(access(new URL("../public/docs/sources/index.html", import.meta.url)));
});
