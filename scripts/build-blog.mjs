import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentRoot = path.join(root, "content", "blog");
const publicRoot = path.join(root, "public");
const generatedBlogRoot = path.join(publicRoot, "blog");
const retiredDocsRoot = path.join(publicRoot, "docs");
const siteCssSrc = path.join(root, "src", "styles.css");
const siteCssDest = path.join(publicRoot, "assets", "site.css");
const themeJsSrc = path.join(root, "src", "theme.js");
const themeJsDest = path.join(publicRoot, "assets", "theme.js");

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

function isRustScriptFence(lang) {
  return /^(rss|rustscript)$/i.test(lang.trim());
}

function highlightRustScript(code) {
  const tokenPattern = /(\/\/.*)|("(?:\\\\.|[^"\\\\])*")|(\b\d(?:[\d_]*\d)?\b)|(\b(?:fn|pub|let|mut|if|else|match|for|while|use|struct|return|true|false|None|Some)\b)|(\b(?:int|string|bool|float|bytes|map)\b)|(\b[A-Z][A-Za-z0-9_]*\b)|(\b[A-Za-z_][A-Za-z0-9_]*(?=\s*(?:<|::\s*<)?\())/g;
  let output = "";
  let cursor = 0;

  for (const match of code.matchAll(tokenPattern)) {
    output += escapeHtml(code.slice(cursor, match.index));
    const [token, comment, stringLiteral, numberLiteral, keyword, builtinType, namedType, fnName] = match;
    let className = "";
    if (comment) className = "tok-comment";
    else if (stringLiteral) className = "tok-str";
    else if (numberLiteral) className = "tok-num";
    else if (keyword) className = "tok-kw";
    else if (builtinType || namedType) className = "tok-type";
    else if (fnName) className = "tok-fn";

    const escapedToken = escapeHtml(token);
    output += className ? `<span class="${className}">${escapedToken}</span>` : escapedToken;
    cursor = match.index + token.length;
  }

  output += escapeHtml(code.slice(cursor));
  return output;
}

function renderCodeFence(lang, code) {
  const safeLang = escapeHtml(lang.trim());
  if (isRustScriptFence(lang)) {
    return `<pre class="rss-code"><code class="language-${safeLang}">${highlightRustScript(code)}</code></pre>`;
  }
  return `<pre><code class="language-${safeLang}">${escapeHtml(code)}</code></pre>`;
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
        blocks.push(renderCodeFence(fenceLang, fence.join("\n")));
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

function layout({ title, description = "RustScript blog", body, section = "Blog", pageClass = "" }) {
  const shellClass = ["doc-shell", pageClass].filter(Boolean).join(" ");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="icon" href="/assets/rustscript-logo-crabstick.png" />
    <link rel="stylesheet" href="/assets/site.css" />
    <script src="/assets/theme.js"></script>
    <title>${escapeHtml(title)} · RustScript</title>
  </head>
  <body>
    <div class="site-header-shell">
      <header class="site-header">
      <a class="brand" href="/" aria-label="RustScript home">
        <img src="/assets/rustscript-logo-crabstick.png" alt="RustScript crab stick logo" width="44" height="44" />
        <span>RustScript</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="/#design">Design</a>
        <a href="/#uses">Uses</a>
        <a href="/blog/">Blog</a>
        <a href="/#ecosystem">Links</a>
      </nav>
      <div id="theme-control" class="theme-control" role="group" aria-label="Color theme" data-theme="system">
        <button class="theme-option" type="button" data-theme-choice="system" aria-label="Follow system theme" title="Follow system theme">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="2"></rect><path d="M8 21h8M12 17v4"></path></svg>
        </button>
        <button class="theme-option" type="button" data-theme-choice="light" aria-label="Light theme" title="Light theme">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2.5M12 19.5V22M4.93 4.93 6.7 6.7M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07 6.7 17.3M17.3 6.7l1.77-1.77"></path></svg>
        </button>
        <button class="theme-option" type="button" data-theme-choice="dark" aria-label="Dark theme" title="Dark theme">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5"></path></svg>
        </button>
      </div>
      </header>
    </div>
    <main class="doc-page">
      <article class="${shellClass}">
        <p class="eyebrow">${escapeHtml(section)}</p>
        ${body}
      </article>
    </main>
    <footer class="site-footer">
      <span>RustScript</span>
      <nav aria-label="Footer links">
        <a href="/">Home</a>
        <a href="/blog/">Blog</a>
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
await copyFile(themeJsSrc, themeJsDest);
await rm(retiredDocsRoot, { recursive: true, force: true });
await rm(generatedBlogRoot, { recursive: true, force: true });

const files = await listMarkdownFiles(contentRoot);
const items = [];

for (const file of files) {
  const markdown = await readFile(file, "utf8");
  const title = titleFromMarkdown(markdown, path.basename(file, ".md"));
  const parts = relativeOutputPath(file);
  const href = `/blog/${parts.join("/")}/`;
  const outDir = path.join(generatedBlogRoot, ...parts);
  const html = layout({
    title,
    description: `${title} · RustScript`,
    section: "Blog",
    pageClass: "blog-post",
    body: `<nav class="doc-breadcrumb"><a href="/blog/">Blog</a></nav>${renderMarkdown(markdown)}`,
  });
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "index.html"), html);
  items.push({ title, href, kind: "Blog" });
}

await mkdir(generatedBlogRoot, { recursive: true });
await writeFile(
  path.join(generatedBlogRoot, "index.html"),
  cardList("Blog", "Design rationale and implementation notes for RustScript and pd-vm.", items),
);

console.log(`generated ${files.length} markdown pages`);
