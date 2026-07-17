import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentRoot = path.join(root, "content", "docs");
const outputRoot = path.join(root, "public", "docs");

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
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
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

function highlightRss(code) {
  const tokenPattern = /(\/\/.*)|("(?:\\.|[^"\\])*")|(\b\d(?:[\d_]*\d)?\b)|(\b(?:fn|pub|let|mut|if|else|match|for|while|use|struct|return|true|false|None|Some|=>)\b)|(\b(?:int|string|bool|float|bytes|map|array)\b)|(\b[A-Z][A-Za-z0-9_]*\b)|(\b[A-Za-z_][A-Za-z0-9_]*(?=\s*(?:<|::\s*<)?\())/g;
  let output = "";
  let cursor = 0;
  for (const match of code.matchAll(tokenPattern)) {
    output += escapeHtml(code.slice(cursor, match.index));
    const [token, comment, stringLiteral, numberLiteral, keyword, builtinType, namedType, fnName] = match;
    const cls = comment ? "tok-comment"
      : stringLiteral ? "tok-str"
        : numberLiteral ? "tok-num"
          : keyword ? "tok-kw"
            : builtinType || namedType ? "tok-type"
              : fnName ? "tok-fn"
                : "";
    output += cls ? `<span class="${cls}">${escapeHtml(token)}</span>` : escapeHtml(token);
    cursor = match.index + token.length;
  }
  return output + escapeHtml(code.slice(cursor));
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
        const codeHtml = fence.language === "rss" ? highlightRss(code) : escapeHtml(code);
        blocks.push(`<pre class="rss-code"><code class="language-${escapeHtml(fence.language)}">${codeHtml}</code></pre>`);
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
  "/docs/reference/rss/",
  "/docs/reference/host-functions/",
  "/docs/reference/runtime-controls/",
  "/docs/reference/pd-edge/",
  "/docs/reference/pd-edge/full-dag/",
  "/docs/reference/pd-controller/",
  "/docs/reference/micro-rustscript/",
  "/docs/reference/ironrust/",
  "/docs/reference/flint/",
  "/docs/contribute/architecture/",
  "/docs/contribute/vm-and-compiler/",
  "/docs/contribute/runtimes/",
  "/docs/terminology/",
];

function documentationSidebar(pages, currentHref) {
  const overview = pages.find((page) => page.href === "/docs/");
  const groups = navigationGroups.map((group) => {
    const groupPages = pages.filter(group.include)
      .sort((left, right) => {
        const leftIndex = navigationOrder.indexOf(left.href);
        const rightIndex = navigationOrder.indexOf(right.href);
        return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
      });
    if (groupPages.length === 0) return "";
    const links = groupPages.map((page) => `<a href="${page.href}"${page.href === currentHref ? ' aria-current="page"' : ""}>${escapeHtml(page.title.replace(/`/g, ""))}</a>`).join("");
    return `<section class="docs-nav-section"><h2>${group.label}</h2>${links}</section>`;
  }).join("");
  const overviewLink = overview ? `<a class="docs-nav-overview" href="${overview.href}"${overview.href === currentHref ? ' aria-current="page"' : ""}>${escapeHtml(overview.title)}</a>` : "";
  return `<aside class="docs-sidebar"><details open><summary>Documentation navigation</summary><nav aria-label="Documentation navigation">${overviewLink}${groups}</nav></details></aside>`;
}

function layout({ title, body, breadcrumb, sidebar }) {
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
  return { file, markdown, title, parts, href, breadcrumb };
}));

await rm(outputRoot, { recursive: true, force: true });
for (const page of pages) {
  const outDir = path.join(outputRoot, ...page.parts);
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "index.html"), layout({
    title: page.title,
    breadcrumb: page.breadcrumb,
    body: renderMarkdown(page.markdown),
    sidebar: documentationSidebar(pages, page.href),
  }));
}

const routes = pages.map(({ file, href, title }) => ({ file: path.relative(root, file), href, title }));
await writeFile(path.join(outputRoot, "routes.json"), `${JSON.stringify(routes, null, 2)}\n`);
console.log(`generated ${routes.length} documentation pages`);
