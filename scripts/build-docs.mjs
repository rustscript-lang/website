import { highlightRust, highlightRustScript, isRustFence, isRustScriptFence } from "./code-highlighting.mjs";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentRoot = path.join(root, "content", "docs");
const outputRoot = path.join(root, "public", "docs");
const assetRoot = path.join(root, "public", "assets");
const mermaidBundle = path.join(root, "node_modules", "mermaid", "dist", "mermaid.min.js");
const mermaidInit = path.join(root, "src", "mermaid-init.js");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function titleFromMarkdown(markdown, fallback) {
  const docsTitle = markdown.match(/^<!-- docs-title: (.+) -->\n/);
  if (docsTitle) return docsTitle[1].trim();
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function renderPageMarkdown(markdown, title) {
  const content = markdown.replace(/^<!-- docs-title: .+ -->\n\n/, "");
  const heading = content === markdown ? "" : `<h1 id="${slugify(title)}">${escapeHtml(title)}</h1>\n`;
  return `${heading}${renderMarkdown(content)}`;
}

async function listMarkdownFiles(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith("_")) {
      files.push(...(await listMarkdownFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function externalLinkAttrs(href) {
  return /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
}

function inlineMarkdown(value) {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const safeHref = escapeHtml(href);
    return `<a href="${safeHref}"${externalLinkAttrs(href)}>${label}</a>`;
  });
  return html;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];
  let table = [];
  let fence = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length > 0) {
      blocks.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  };
  const flushTable = () => {
    if (table.length === 0) return;
    const [header, ...rows] = table;
    blocks.push(`<div class="docs-table-wrap"><table class="docs-table"><thead><tr>${header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
    table = [];
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (fence) {
        const code = fence.lines.join("\n");
        if (fence.language === "mermaid") {
          blocks.push(`<div class="mermaid" role="img" aria-label="Mermaid diagram">${escapeHtml(code)}</div>`);
        } else {
          const codeHtml = isRustScriptFence(fence.language)
            ? highlightRustScript(code)
            : isRustFence(fence.language)
              ? highlightRust(code)
              : escapeHtml(code);
          blocks.push(`<pre class="rss-code"><code class="language-${escapeHtml(fence.language)}">${codeHtml}</code></pre>`);
        }
        fence = null;
      } else {
        flushParagraph();
        flushList();
        flushTable();
        fence = { language: line.slice(3).trim() || "text", lines: [] };
      }
      continue;
    }
    if (fence) {
      fence.lines.push(line);
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushParagraph();
      flushList();
      const cells = trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
      const divider = cells.every((cell) => /^:?-{3,}:?$/.test(cell));
      if (!divider) table.push(cells);
      continue;
    }
    flushTable();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const text = heading[2].trim();
      blocks.push(`<h${level} id="${slugify(text.replace(/`/g, ""))}">${inlineMarkdown(text)}</h${level}>`);
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1].trim());
      continue;
    }
    paragraph.push(line.trim());
  }

  if (fence) throw new Error("unterminated code fence");
  flushParagraph();
  flushList();
  flushTable();
  return blocks.join("\n");
}

function routeFor(file) {
  const relative = path.relative(contentRoot, file);
  const parsed = path.parse(relative);
  if (parsed.name === "index") return parsed.dir ? parsed.dir.split(path.sep) : [];
  return [...(parsed.dir ? parsed.dir.split(path.sep) : []), parsed.name];
}

const ecosystemRoutes = new Set([
  "/docs/reference/pd-edge/",
  "/docs/reference/pd-controller/",
  "/docs/reference/micro-rustscript/",
  "/docs/reference/ironrust/",
  "/docs/reference/flint/",
]);

function isEcosystemRoute(href) {
  return ecosystemRoutes.has(href) || href.startsWith("/docs/reference/pd-edge/");
}

const navigationGroups = [
  { label: "Getting Started", include: (page) => page.href.startsWith("/docs/learn/") },
  { label: "Reference", include: (page) => page.href.startsWith("/docs/reference/") && !isEcosystemRoute(page.href) },
  { label: "Ecosystem", include: (page) => isEcosystemRoute(page.href) },
  { label: "Contribute", include: (page) => page.href.startsWith("/docs/contribute/") },
  { label: "About", include: (page) => page.href !== "/docs/" && !page.href.startsWith("/docs/learn/") && !page.href.startsWith("/docs/reference/") && !page.href.startsWith("/docs/contribute/") },
];

const navigationOrder = [
  "/docs/learn/getting-started/",
  "/docs/learn/rss-basics/",
  "/docs/learn/embed-pd-vm/",
  "/docs/learn/runtimes/",
  "/docs/reference/rustscript/",
  "/docs/reference/rustscript/development/",
  "/docs/reference/rustscript/internals/",
  "/docs/reference/rss/",
  "/docs/reference/rss/builtins/",
  "/docs/reference/rss/builtins/global/",
  "/docs/reference/rss/builtins/bytes/",
  "/docs/reference/rss/builtins/io/",
  "/docs/reference/rss/builtins/re/",
  "/docs/reference/rss/builtins/json/",
  "/docs/reference/rss/builtins/jit/",
  "/docs/reference/rss/builtins/math/",
  "/docs/reference/rss/builtins/runtime/",
  "/docs/reference/rss/stdlibs/",
  "/docs/reference/rss/stdlibs/bytes/",
  "/docs/reference/rss/stdlibs/collections/",
  "/docs/reference/rss/stdlibs/io/",
  "/docs/reference/rss/stdlibs/iter/",
  "/docs/reference/rss/stdlibs/lrucache/",
  "/docs/reference/rss/stdlibs/math/",
  "/docs/reference/rss/stdlibs/parse/",
  "/docs/reference/rss/stdlibs/path/",
  "/docs/reference/rss/stdlibs/strings/",
  "/docs/reference/host-functions/",
  "/docs/reference/runtime-controls/",
  "/docs/reference/pd-edge/",
  "/docs/reference/pd-edge/operations/",
  "/docs/reference/pd-edge/layered-dags/",
  "/docs/reference/pd-edge/full-dag/",
  "/docs/reference/pd-edge/distribution/",
  "/docs/reference/pd-controller/",
  "/docs/reference/micro-rustscript/",
  "/docs/reference/micro-rustscript/firmware-and-development/",
  "/docs/reference/ironrust/",
  "/docs/reference/ironrust/compilation-and-packaging/",
  "/docs/reference/ironrust/operations/",
  "/docs/reference/flint/",
  "/docs/reference/flint/cli-and-execution/",
  "/docs/reference/flint/host-functions/",
  "/docs/contribute/architecture/",
  "/docs/contribute/vm-and-compiler/",
  "/docs/contribute/runtimes/",
  "/docs/terminology/",
];

function documentationSidebar(pages, currentHref) {
  const overview = pages.find((page) => page.href === "/docs/");
  const pagesByHref = new Map(pages.map((page) => [page.href, page]));
  const childrenByHref = new Map();
  const parentFor = (page) => {
    const parentParts = page.parts.slice(0, -1);
    if (parentParts.length === 0) return null;
    return pagesByHref.get(`/docs/${parentParts.join("/")}/`) ?? null;
  };

  for (const page of pages) {
    const parent = parentFor(page);
    if (!parent) continue;
    const children = childrenByHref.get(parent.href) ?? [];
    children.push(page);
    childrenByHref.set(parent.href, children);
  }

  const sortPages = (items) => [...items].sort((left, right) => {
    const leftIndex = navigationOrder.indexOf(left.href);
    const rightIndex = navigationOrder.indexOf(right.href);
    return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
  });
  const renderLink = (page) => `<a href="${page.href}"${page.href === currentHref ? ' aria-current="page"' : ""}>${escapeHtml(page.title.replace(/`/g, ""))}</a>`;
  const renderItem = (page) => {
    const children = sortPages(childrenByHref.get(page.href) ?? []);
    const nested = children.length > 0 ? `<div class="docs-nav-children">${children.map(renderItem).join("")}</div>` : "";
    return `<div class="docs-nav-item">${renderLink(page)}${nested}</div>`;
  };
  const rootPages = pages.filter((page) => !parentFor(page));
  const groups = navigationGroups.map((group) => {
    const groupPages = sortPages(rootPages.filter(group.include));
    if (groupPages.length === 0) return "";
    return `<section class="docs-nav-section"><h2>${group.label}</h2>${groupPages.map(renderItem).join("")}</section>`;
  }).join("");
  const overviewLink = overview ? `<a class="docs-nav-overview" href="${overview.href}"${overview.href === currentHref ? ' aria-current="page"' : ""}>${escapeHtml(overview.title)}</a>` : "";
  return `<aside class="docs-sidebar"><details open><summary>Documentation navigation</summary><nav aria-label="Documentation navigation">${overviewLink}${groups}</nav></details></aside>`;
}

function layout({ title, body, breadcrumb, sidebar, hasMermaid }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(title)} · RustScript documentation" />
    <link rel="icon" href="/assets/rustscript-logo-crabstick.png" />
    <link rel="stylesheet" href="/assets/site.css" />
    <style>
      .docs-main { width: min(1440px, calc(100% - 2rem)); margin: 0 auto; padding: 1.8rem 0 4rem; }
      .docs-layout { display: grid; grid-template-columns: minmax(13.5rem, 17rem) minmax(0, 48rem); justify-content: center; gap: clamp(2rem, 5vw, 5.5rem); align-items: start; }
      .docs-sidebar { position: sticky; top: 6.25rem; max-height: calc(100vh - 7.5rem); overflow-y: auto; padding: 0 1.5rem 1.5rem 0; border-right: 1px solid var(--border); }
      .docs-sidebar details { margin: 0; }
      .docs-sidebar summary { display: none; }
      .docs-sidebar nav { display: grid; gap: 1.45rem; }
      .docs-sidebar a { display: block; padding: 0.34rem 0.62rem; border-left: 2px solid transparent; color: var(--muted); font-size: 0.88rem; line-height: 1.35; text-decoration: none; }
      .docs-sidebar a:hover { color: var(--ink); background: var(--card-hover); }
      .docs-sidebar a[aria-current="page"] { border-left-color: var(--accent-strong); color: var(--accent-strong); font-weight: 700; background: rgba(167, 83, 66, 0.1); }
      .docs-sidebar .docs-nav-overview { margin-bottom: 0.3rem; color: var(--ink); font-weight: 700; }
      .docs-nav-section { display: grid; gap: 0.12rem; }
      .docs-nav-item { display: grid; gap: 0.12rem; }
      .docs-nav-children { display: grid; gap: 0.08rem; margin: 0.05rem 0 0.2rem 0.82rem; padding-left: 0.36rem; border-left: 1px solid var(--border); }
      .docs-nav-children a { font-size: 0.8rem; }
      .docs-nav-section h2 { margin: 0 0 0.35rem 0.62rem; color: var(--ink); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
      .docs-page { min-width: 0; }
      .doc-shell.docs-page { max-width: none; border: 0; border-radius: 0; background: transparent; box-shadow: none; padding: 0; }
      .doc-shell.docs-page h1 { margin: 0 0 0.625rem; font-size: clamp(1.3rem, 3vw, 2.8rem); line-height: 1.08; letter-spacing: -0.045em; }
      .doc-shell.docs-page h2 { margin-top: 1.5rem; font-size: clamp(0.9rem, 2vw, 1.5rem); line-height: 1.18; }
      .doc-shell.docs-page h3 { margin-top: 1rem; font-size: 0.725rem; }
      .doc-shell.docs-page h4 { margin-top: 0.85rem; font-size: 0.5rem; }
      .doc-shell.docs-page h5 { margin-top: 0.75rem; font-size: 0.42rem; }
      .doc-shell.docs-page h6 { margin-top: 0.65rem; font-size: 0.36rem; }
      .doc-shell.docs-page p, .doc-shell.docs-page li { color: var(--muted); font-size: 1rem; line-height: 1.76; }
      .doc-shell.docs-page p { max-width: 72ch; }
      .docs-page .doc-breadcrumb { margin-bottom: 1.65rem; font-size: 0.82rem; }
      .doc-shell.docs-page pre { border-radius: 8px; box-shadow: none; }
      .mermaid { position: relative; overflow: hidden; margin: 1.5rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface-strong); }
      .mermaid-inline-svg { display: block; width: 100%; max-width: 100%; height: auto; margin: 0 auto; }
      .mermaid-expand { position: absolute; right: 0.65rem; bottom: 0.65rem; display: grid; width: 2.35rem; height: 2.35rem; padding: 0; place-items: center; border: 1px solid var(--border); border-radius: 7px; color: var(--ink); background: var(--surface-strong); box-shadow: 0 8px 24px rgba(34, 24, 20, 0.16); cursor: pointer; }
      .mermaid-expand:hover { color: var(--accent-strong); background: var(--card-hover); }
      .mermaid-expand:focus-visible, .mermaid-lightbox button:focus-visible { outline: 2px solid var(--accent-strong); outline-offset: 2px; }
      .mermaid-expand svg, .mermaid-lightbox button svg { width: 1.15rem; height: 1.15rem; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      .mermaid-lightbox { position: fixed; inset: 0; z-index: 1000; display: grid; padding: clamp(0.75rem, 2.5vw, 2rem); place-items: center; background: rgba(18, 16, 15, 0.76); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
      .mermaid-lightbox-panel { display: grid; grid-template-rows: auto minmax(0, 1fr); width: min(96vw, 100rem); height: min(92vh, 64rem); overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: var(--bg); box-shadow: 0 28px 90px rgba(0, 0, 0, 0.38); }
      .mermaid-lightbox-toolbar { display: flex; align-items: center; gap: 0.45rem; padding: 0.6rem 0.7rem; border-bottom: 1px solid var(--border); background: var(--surface-strong); }
      .mermaid-lightbox-toolbar button { display: grid; min-width: 2.2rem; height: 2.2rem; padding: 0 0.6rem; place-items: center; border: 1px solid var(--border); border-radius: 6px; color: var(--ink); background: transparent; font: inherit; font-size: 0.78rem; cursor: pointer; }
      .mermaid-lightbox-toolbar button:hover { color: var(--accent-strong); background: var(--card-hover); }
      .mermaid-lightbox-toolbar output { min-width: 3.5rem; color: var(--muted); font-size: 0.78rem; font-variant-numeric: tabular-nums; text-align: center; }
      .mermaid-lightbox-reset { margin-left: auto; }
      .mermaid-lightbox-viewport { min-width: 0; min-height: 0; overflow: hidden; padding: clamp(0.75rem, 2vw, 1.5rem); cursor: grab; touch-action: none; background-color: var(--bg); background-image: radial-gradient(circle at center, rgba(167, 83, 66, 0.1) 1px, transparent 1px); background-size: 18px 18px; }
      .mermaid-lightbox-viewport.is-panning { cursor: grabbing; user-select: none; }
      .mermaid-lightbox-svg { display: block; width: 100%; height: 100%; max-width: none; margin: 0; }
      .mermaid-render-failed { margin: 1.5rem 0; padding: 1rem; border: 1px solid var(--border); border-radius: 8px; color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; text-align: left; white-space: pre; }
      .docs-table-wrap { overflow-x: auto; margin: 1.25rem 0; border: 1px solid var(--border); border-radius: 8px; }
      .docs-table { width: 100%; min-width: 32rem; border-collapse: collapse; }
      .docs-table th, .docs-table td { padding: 0.72rem 0.88rem; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
      .docs-table th { background: rgba(167, 83, 66, 0.08); font-weight: 700; }
      .docs-table tr:last-child td { border-bottom: 0; }
      @media (max-width: 860px) {
        .docs-main { width: min(100% - 1.25rem, 48rem); padding-top: 1.25rem; }
        .docs-layout { display: block; }
        .docs-sidebar { position: static; max-height: none; overflow: visible; margin-bottom: 1.75rem; padding: 0; border: 1px solid var(--border); border-radius: 8px; background: var(--surface-strong); }
        .docs-sidebar summary { display: block; padding: 0.9rem 1rem; color: var(--ink); cursor: pointer; font-size: 0.9rem; font-weight: 700; }
        .docs-sidebar nav { padding: 0 0.5rem 0.75rem; }
      }
    </style>
    <script src="/assets/theme.js"></script>
    ${hasMermaid ? '<script defer src="/assets/mermaid.min.js"></script>\n    <script defer src="/assets/mermaid-init.js"></script>' : ""}
    <title>${escapeHtml(title)} · RustScript Documentation</title>
  </head>
  <body>
    <div class="site-header-shell">
      <header class="site-header">
        <a class="brand" href="/" aria-label="RustScript home"><img src="/assets/rustscript-logo-crabstick.png" alt="RustScript crab stick logo" width="44" height="44" /><span>RustScript</span></a>
        <nav aria-label="Main navigation"><a href="/docs/">Documentation</a><a href="/blog/">Blog</a><a href="https://playground.rustscript.org/" target="_blank" rel="noopener noreferrer">Playground</a></nav>
        <div id="theme-control" class="theme-control" role="group" aria-label="Color theme" data-theme="system">
          <button class="theme-option" type="button" data-theme-choice="system" aria-label="Follow system theme" title="Follow system theme"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="2"></rect><path d="M8 21h8M12 17v4"></path></svg></button>
          <button class="theme-option" type="button" data-theme-choice="light" aria-label="Light theme" title="Light theme"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2.5M12 19.5V22M4.93 4.93 6.7 6.7M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07 6.7 17.3M17.3 6.7l1.77-1.77"></path></svg></button>
          <button class="theme-option" type="button" data-theme-choice="dark" aria-label="Dark theme" title="Dark theme"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5"></path></svg></button>
        </div>
      </header>
    </div>
    <main class="docs-main"><div class="docs-layout">${sidebar}<article class="doc-shell docs-page"><nav class="doc-breadcrumb"><a href="/docs/">Documentation</a>${breadcrumb}</nav>${body}</article></div></main>
    <footer class="site-footer"><span>RustScript</span><nav aria-label="Footer links"><a href="/">Home</a><a href="/docs/">Documentation</a><a href="https://github.com/rustscript-lang" target="_blank" rel="noopener noreferrer">GitHub org</a></nav></footer>
  </body>
</html>`;
}

const files = await listMarkdownFiles(contentRoot);
const pages = await Promise.all(files.map(async (file) => {
  const markdown = await readFile(file, "utf8");
  const title = titleFromMarkdown(markdown, path.basename(file, ".md"));
  const parts = routeFor(file);
  const href = `/docs/${parts.length ? `${parts.join("/")}/` : ""}`;
  const breadcrumb = parts.length
    ? ` / ${parts.map((part, index) => index === parts.length - 1 ? escapeHtml(part.replaceAll("-", " ")) : `<a href="/docs/${parts.slice(0, index + 1).join("/")}/">${escapeHtml(part.replaceAll("-", " "))}</a>`).join(" / ")}`
    : "";
  return { file, markdown, hasMermaid: /```mermaid\s*$/m.test(markdown), title, parts, href, breadcrumb };
}));

await rm(outputRoot, { recursive: true, force: true });
if (pages.some((page) => page.hasMermaid)) {
  await mkdir(assetRoot, { recursive: true });
  await Promise.all([
    copyFile(mermaidBundle, path.join(assetRoot, "mermaid.min.js")),
    copyFile(mermaidInit, path.join(assetRoot, "mermaid-init.js")),
  ]);
}
for (const page of pages) {
  const outDir = path.join(outputRoot, ...page.parts);
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "index.html"), layout({
    title: page.title,
    breadcrumb: page.breadcrumb,
    body: renderPageMarkdown(page.markdown, page.title),
    hasMermaid: page.hasMermaid,
    sidebar: documentationSidebar(pages, page.href),
  }));
}

const routes = pages.map(({ file, href, title }) => ({ file: path.relative(root, file), href, title }));
await writeFile(path.join(outputRoot, "routes.json"), `${JSON.stringify(routes, null, 2)}\n`);
console.log(`generated ${routes.length} documentation pages`);
