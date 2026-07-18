import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = path.join(root, "content", "docs", "reference", "rss");
const catalogPath = path.join(root, "content", "docs", "_meta", "runtime-api.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const checkOnly = process.argv.includes("--check");

function tableCell(value) {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function firstParagraph(value) {
  return value.split("\n")[0];
}

function modulePath(section, module) {
  return section === "builtins" ? module.qualified : `stdlib::rss::${module.slug}`;
}

function moduleUsage(section, module) {
  if (module.import) {
    return `## Import\n\n\`\`\`rss\n${module.import}\n\`\`\``;
  }
  if (section === "builtins" && module.slug === "global") {
    return "These functions are available directly; no `use` declaration is required.";
  }
  return `The \`${module.qualified}\` namespace is available directly; no \`use\` declaration is required.`;
}

function typeReference(types = []) {
  if (types.length === 0) return "";
  const rows = types
    .map((type) => `| [\`${type.name}\`](#${type.name.toLowerCase()}) | ${tableCell(type.description)} |`)
    .join("\n");
  const details = types
    .map((type) => `### \`${type.name}\`\n\n\`\`\`rss\n${type.declaration}\n\`\`\`\n\n${type.description}`)
    .join("\n\n");
  return `## Data types\n\n| Type | Description |\n| --- | --- |\n${rows}\n\n## Data type details\n\n${details}\n\n`;
}

function functionReference(functions) {
  const rows = functions
    .map((callable) => `| [\`${callable.name}\`](#${callable.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}) | ${tableCell(firstParagraph(callable.description))} |`)
    .join("\n");
  const details = functions
    .map((callable) => {
      const signatures = callable.signatures.map((signature) => `\`\`\`rss\n${signature}\n\`\`\``).join("\n\n");
      return `### \`${callable.name}\`\n\n${signatures}\n\n${callable.description}`;
    })
    .join("\n\n");
  return `## Functions\n\n| Function | Description |\n| --- | --- |\n${rows}\n\n## Function details\n\n${details}`;
}

function modulePage(section, module) {
  const support = section === "builtins" && module.import
    ? `\n\n**Runtime support:** ${module.wasm ? "native and WebAssembly" : "native runtimes"}.`
    : "";
  return `<!-- docs-title: ${module.title} -->\n\n\`${modulePath(section, module)}\`\n\n${module.description}${support}\n\n${moduleUsage(section, module)}\n\n${typeReference(module.types)}${functionReference(module.functions)}\n`;
}

function sectionPage(section, data) {
  const count = data.modules.reduce((total, module) => total + module.functions.length, 0);
  const rows = data.modules
    .map((module) => `| [\`${module.title}\`](./${module.slug}/) | ${module.functions.length} | ${tableCell(module.description)} |`)
    .join("\n");
  const usage = section === "builtins"
    ? "Builtin namespaces are supplied by the compiler and VM. Global functions require no import; named namespaces use declarations such as `use math;`."
    : "Stdlib modules are pure RustScript sources. Import a module with a path such as `use stdlib::rss::strings;`.";
  return `# ${data.title}\n\n${data.description}\n\n${usage}\n\nThis section documents ${count} public functions.\n\n## Modules\n\n| Module | Functions | Description |\n| --- | ---: | --- |\n${rows}\n`;
}

function expectedFiles() {
  const files = new Map();
  for (const section of ["builtins", "stdlibs"]) {
    const data = catalog[section];
    files.set(path.join(contentRoot, section, "index.md"), sectionPage(section, data));
    for (const module of data.modules) {
      files.set(path.join(contentRoot, section, module.slug, "index.md"), modulePage(section, module));
    }
  }
  return files;
}

const files = expectedFiles();
if (checkOnly) {
  const stale = [];
  for (const [file, expected] of files) {
    try {
      const actual = await readFile(file, "utf8");
      if (actual !== expected) stale.push(path.relative(root, file));
    } catch {
      stale.push(path.relative(root, file));
    }
  }
  if (stale.length > 0) {
    throw new Error(`API reference is stale:\n${stale.join("\n")}`);
  }
} else {
  for (const section of ["builtins", "stdlibs"]) {
    await rm(path.join(contentRoot, section), { recursive: true, force: true });
  }
  for (const [file, markdown] of files) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, markdown);
  }
}
