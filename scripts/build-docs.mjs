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
        blocks.push(`<pre class="rss-code"><code class="language-${escapeHtml(fence.language)}">${escapeHtml(fence.lines.join("\n"))}</code></pre>`);
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

function layout({ title, body, breadcrumb }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(title)} · RustScript documentation" />
    <link rel="icon" href="/assets/rustscript-logo-crabstick.png" />
    <link rel="stylesheet" href="/assets/site.css" />
    <style>
      .docs-table-wrap { overflow-x: auto; margin: 1.25rem 0; border: 1px solid var(--line); border-radius: 0.75rem; }
      .docs-table { width: 100%; border-collapse: collapse; min-width: 32rem; }
      .docs-table th, .docs-table td { padding: 0.75rem 0.9rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
      .docs-table th { background: var(--surface-strong); font-weight: 700; }
      .docs-table tr:last-child td { border-bottom: 0; }
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
    <main class="doc-page"><article class="doc-shell docs-page"><nav class="doc-breadcrumb"><a href="/docs/">Documentation</a>${breadcrumb}</nav>${body}</article></main>
    <footer class="site-footer"><span>RustScript</span><nav aria-label="Footer links"><a href="/">Home</a><a href="/docs/">Documentation</a><a href="https://github.com/rustscript-lang" target="_blank" rel="noopener noreferrer">GitHub org</a></nav></footer>
  </body>
</html>`;
}

const files = await listMarkdownFiles(contentRoot);
await rm(outputRoot, { recursive: true, force: true });
const routes = [];
for (const file of files) {
  const markdown = await readFile(file, "utf8");
  const title = titleFromMarkdown(markdown, path.basename(file, ".md"));
  const parts = routeFor(file);
  const href = `/docs/${parts.length ? `${parts.join("/")}/` : ""}`;
  const breadcrumbs = parts.length
    ? ` / ${parts.map((part, index) => index === parts.length - 1 ? escapeHtml(part.replaceAll("-", " ")) : `<a href="/docs/${parts.slice(0, index + 1).join("/")}/">${escapeHtml(part.replaceAll("-", " "))}</a>`).join(" / ")}`
    : "";
  const outDir = path.join(outputRoot, ...parts);
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "index.html"), layout({ title, breadcrumb: breadcrumbs, body: renderMarkdown(markdown) }));
  routes.push({ file: path.relative(root, file), href, title });
}

await writeFile(path.join(outputRoot, "routes.json"), `${JSON.stringify(routes, null, 2)}\n`);
console.log(`generated ${routes.length} documentation pages`);
