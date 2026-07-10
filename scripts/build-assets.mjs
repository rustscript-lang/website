import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const publicRoot = path.join(root, "public");
const siteCssDest = path.join(publicRoot, "assets", "site.css");

await mkdir(path.dirname(siteCssDest), { recursive: true });
await copyFile(path.join(root, "src", "styles.css"), siteCssDest);
await rm(path.join(publicRoot, "docs"), { recursive: true, force: true });

console.log("prepared static assets");
