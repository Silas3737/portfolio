import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = path.join(root, "website");
const versionPattern = /\?v=\d{8}-\d+/;
const referencedFiles = new Set();

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function withoutQuery(value) {
  return value.split("?")[0].split("#")[0];
}

function isExternal(value) {
  return /^(https?:|mailto:|tel:|#)/.test(value);
}

function assertFileReference(file, attr, value, errors) {
  if (!value || isExternal(value)) return;

  const target = path.resolve(path.dirname(file), withoutQuery(value));
  if (!target.startsWith(siteDir) || !existsSync(target)) {
    errors.push(`${path.relative(root, file)} has missing ${attr}: ${value}`);
    return;
  }

  referencedFiles.add(target);
}

function assertSrcsetReferences(file, value, errors) {
  for (const candidate of value.split(",")) {
    const source = candidate.trim().split(/\s+/)[0];
    assertFileReference(file, "srcset reference", source, errors);
  }
}

function assertHeadMetadata(file, source, errors) {
  const rel = path.relative(root, file);

  if (!/<title>[^<]{6,}<\/title>/i.test(source)) {
    errors.push(`${rel} needs a descriptive title`);
  }

  if (!/<meta\s+name=["']description["']\s+content=["'][^"']{20,}["']/i.test(source)) {
    errors.push(`${rel} needs a meta description`);
  }

}

function assertBalancedMarkup(file, source, errors) {
  const rel = path.relative(root, file);
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
  const stack = [];
  const tagPattern = /<\/?([a-zA-Z][\w:-]*)(?:\s[^<>]*)?>/g;

  for (const match of source.matchAll(tagPattern)) {
    const raw = match[0];
    const tag = match[1].toLowerCase();

    if (voidTags.has(tag) || raw.endsWith("/>")) continue;

    if (raw.startsWith("</")) {
      const openTag = stack.pop();
      if (openTag !== tag) {
        errors.push(`${rel} has unbalanced markup near ${raw}`);
        return;
      }
    } else {
      stack.push(tag);
    }
  }

  if (stack.length) {
    errors.push(`${rel} has unclosed tags: ${stack.join(", ")}`);
  }
}

const htmlFiles = walk(siteDir).filter((file) => file.endsWith(".html"));
const cssFiles = walk(siteDir).filter((file) => file.endsWith(".css"));
const errors = [];

for (const file of htmlFiles) {
  const source = readFileSync(file, "utf8");
  const rel = path.relative(root, file);

  assertHeadMetadata(file, source, errors);
  assertBalancedMarkup(file, source, errors);

  if (/<style[\s>]/i.test(source)) {
    errors.push(`${rel} contains inline <style>; move styles into CSS files`);
  }

  if (/\son\w+=/i.test(source)) {
    errors.push(`${rel} contains inline event handlers`);
  }

  for (const match of source.matchAll(/\s(?:href|src)=["']([^"']+)["']/g)) {
    assertFileReference(file, "asset reference", match[1], errors);
  }

  for (const match of source.matchAll(/\ssrcset=["']([^"']+)["']/g)) {
    assertSrcsetReferences(file, match[1], errors);
  }

  for (const match of source.matchAll(/(?:href|src)=["']([^"']+\.(?:css|js)(?:\?[^"']*)?)["']/g)) {
    if (!versionPattern.test(match[1])) {
      errors.push(`${rel} references ${match[1]} without a version query`);
    }
  }

  if (/<tbody[^>]*>\s*<\/tbody>/i.test(source)) {
    errors.push(`${rel} contains an empty table body`);
  }
}

for (const file of cssFiles) {
  const source = readFileSync(file, "utf8");
  const rel = path.relative(root, file);

  for (const match of source.matchAll(/@import\s+url\(["']?([^"')]+)["']?\)/g)) {
    assertFileReference(file, "CSS import", match[1], errors);
    if (!versionPattern.test(match[1])) {
      errors.push(`${rel} imports ${match[1]} without a version query`);
    }
  }
}

for (const file of referencedFiles) {
  if (!/\.(?:png|jpe?g|webp|gif)$/i.test(file)) continue;

  const maxBytes = 1_250_000;
  const { size } = statSync(file);
  if (size > maxBytes) {
    errors.push(`${path.relative(root, file)} is ${(size / 1024 / 1024).toFixed(2)}MB; optimize referenced images below 1.25MB`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML files and ${cssFiles.length} CSS files.`);
