import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentRoot = path.join(root, "content", "docs");
const publicRoot = path.join(root, "public");
const generatedDocsRoot = path.join(publicRoot, "docs");
const siteCssSrc = path.join(root, "src", "styles.css");
const siteCssDest = path.join(publicRoot, "assets", "site.css");

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
    .replace(/^-+|-+$/g, "") || "page";
}

function titleFromMarkdown(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

async function listMarkdownFiles(dir) {
  if (!existsSync(dir)) return [];
  const entries = await import("node:fs/promises").then((fs) => fs.readdir(dir, { withFileTypes: true }));
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function isExternalHref(href) {
  return /^https?:\/\//i.test(href);
}

function externalLinkAttrs(href) {
  return isExternalHref(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
}

function inlineMarkdown(value) {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
    const safeHref = escapeHtml(href);
    return `<a href="${safeHref}"${externalLinkAttrs(href)}>${label}</a>`;
  });
  return html;
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderTable(lines) {
  const header = splitTableRow(lines[0]);
  const body = lines.slice(2).map(splitTableRow);
  return `<div class="doc-table-wrap"><table><thead><tr>${header
    .map((cell) => `<th>${inlineMarkdown(cell)}</th>`)
    .join("")}</tr></thead><tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];
  let inFence = false;
  let fenceLang = "";
  let fence = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith("```")) {
      if (inFence) {
        blocks.push(`<pre><code class="language-${escapeHtml(fenceLang)}">${escapeHtml(fence.join("\n"))}</code></pre>`);
        inFence = false;
        fenceLang = "";
        fence = [];
      } else {
        flushParagraph();
        flushList();
        inFence = true;
        fenceLang = line.slice(3).trim();
      }
      continue;
    }

    if (inFence) {
      fence.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushParagraph();
      flushList();
      blocks.push("<hr />");
      continue;
    }

    if (line.includes("|") && lines[index + 1] && isTableSeparator(lines[index + 1])) {
      flushParagraph();
      flushList();
      const tableLines = [line, lines[index + 1]];
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        tableLines.push(lines[index]);
        index += 1;
      }
      index -= 1;
      blocks.push(renderTable(tableLines));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const text = inlineMarkdown(heading[2].trim());
      const id = slugify(heading[2].replace(/`/g, ""));
      blocks.push(`<h${level} id="${id}">${text}</h${level}>`);
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1].trim());
      continue;
    }

    const numbered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (numbered) {
      flushParagraph();
      list.push(numbered[1].trim());
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  return blocks.join("\n");
}

function layout({ title, description = "RustScript documentation", body, section = "Docs" }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="icon" href="/assets/rustscript-logo-crabstick.png" />
    <link rel="stylesheet" href="/assets/site.css" />
    <title>${escapeHtml(title)} · RustScript</title>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/" aria-label="RustScript home">
        <img src="/assets/rustscript-logo-crabstick.png" alt="RustScript crab stick logo" width="44" height="44" />
        <span>RustScript</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="/#design">Design</a>
        <a href="/docs/">Docs</a>
        <a href="/docs/blog/">Blog</a>
        <a href="/#ecosystem">Links</a>
      </nav>
      <a class="header-action" href="https://github.com/rustscript-lang/rustscript" target="_blank" rel="noopener noreferrer">GitHub</a>
    </header>
    <main class="doc-page">
      <article class="doc-shell">
        <p class="eyebrow">${escapeHtml(section)}</p>
        ${body}
      </article>
    </main>
    <footer class="site-footer">
      <span>RustScript</span>
      <nav aria-label="Footer links">
        <a href="/">Home</a>
        <a href="/docs/">Docs</a>
        <a href="/docs/blog/">Blog</a>
        <a href="https://playground.rustscript.org/" target="_blank" rel="noopener noreferrer">Playground</a>
      </nav>
    </footer>
  </body>
</html>`;
}

function relativeOutputPath(file) {
  const rel = path.relative(contentRoot, file);
  const parsed = path.parse(rel);
  const parts = parsed.dir ? parsed.dir.split(path.sep) : [];
  parts.push(slugify(parsed.name));
  return parts;
}

function cardList(title, intro, items) {
  return layout({
    title,
    description: intro,
    section: title,
    body: `<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(intro)}</p>
<div class="doc-card-list">
${items
  .map(
    (item) => `<a href="${item.href}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.kind)}</span></a>`,
  )
  .join("\n")}
</div>`,
  });
}

await mkdir(path.dirname(siteCssDest), { recursive: true });
await copyFile(siteCssSrc, siteCssDest);
await rm(generatedDocsRoot, { recursive: true, force: true });

const files = await listMarkdownFiles(contentRoot);
const items = [];

for (const file of files) {
  const markdown = await readFile(file, "utf8");
  const title = titleFromMarkdown(markdown, path.basename(file, ".md"));
  const parts = relativeOutputPath(file);
  const href = `/docs/${parts.join("/")}/`;
  const outDir = path.join(generatedDocsRoot, ...parts);
  const isBlog = parts[0] === "blog";
  const html = layout({
    title,
    description: `${title} · RustScript`,
    section: isBlog ? "Blog" : "Docs",
    body: `<nav class="doc-breadcrumb"><a href="/docs/">Docs</a>${isBlog ? ` / <a href="/docs/blog/">Blog</a>` : ""}</nav>${renderMarkdown(markdown)}`,
  });
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "index.html"), html);
  items.push({ title, href, kind: isBlog ? "Blog" : "Docs" });
}

const docsItems = items.filter((item) => item.kind === "Docs");
const blogItems = items.filter((item) => item.kind === "Blog");
await mkdir(generatedDocsRoot, { recursive: true });
await writeFile(
  path.join(generatedDocsRoot, "index.html"),
  cardList("Docs", "RustScript design notes, runtime reports, and implementation references.", [
    ...docsItems,
    { title: "Blog", href: "/docs/blog/", kind: "Article index" },
  ]),
);
await mkdir(path.join(generatedDocsRoot, "blog"), { recursive: true });
await writeFile(
  path.join(generatedDocsRoot, "blog", "index.html"),
  cardList("Blog", "Design rationale and implementation notes for RustScript and pd-vm.", blogItems),
);

console.log(`generated ${files.length} markdown pages`);
