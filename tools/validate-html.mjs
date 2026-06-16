import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = path.join(root, "website");
const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const errors = [];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function rel(file) {
  return path.relative(root, file);
}

function validateStructure(file, source) {
  const stack = [];
  const tagPattern = /<\/?([a-zA-Z][\w:-]*)(?:\s[^<>]*)?>/g;

  for (const match of source.replace(/<!--[\s\S]*?-->/g, "").matchAll(tagPattern)) {
    const raw = match[0];
    const tag = match[1].toLowerCase();

    if (raw.startsWith("<!") || raw.startsWith("<?") || raw.endsWith("/>") || voidTags.has(tag)) continue;

    if (raw.startsWith("</")) {
      const openTag = stack.pop();
      if (openTag !== tag) {
        errors.push(`${rel(file)} has unbalanced markup near ${raw}`);
        return;
      }
    } else {
      stack.push(tag);
    }
  }

  if (stack.length) errors.push(`${rel(file)} has unclosed tags: ${stack.join(", ")}`);
}

function validateDocument(file, source) {
  if (!/^<!doctype html>/i.test(source.trimStart())) errors.push(`${rel(file)} needs <!doctype html>`);
  if (!/<html\s+lang=["']zh-CN["']/i.test(source)) errors.push(`${rel(file)} needs html lang="zh-CN"`);
  if (!/<meta\s+name=["']viewport["']/i.test(source)) errors.push(`${rel(file)} needs a viewport meta tag`);
  if (!/<main\b/i.test(source)) errors.push(`${rel(file)} needs a main landmark`);

  const ids = Array.from(source.matchAll(/\sid=["']([^"']+)["']/g), (match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) errors.push(`${rel(file)} has duplicate ids: ${[...new Set(duplicates)].join(", ")}`);
}

const htmlFiles = walk(siteDir).filter((file) => file.endsWith(".html"));

for (const file of htmlFiles) {
  const source = readFileSync(file, "utf8");
  validateStructure(file, source);
  validateDocument(file, source);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML files.`);
