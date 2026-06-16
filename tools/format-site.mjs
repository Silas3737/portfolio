import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const formattedExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".yml", ".yaml"]);
const formattedNames = new Set([".gitignore", ".gitattributes"]);
const targetPaths = [
  ".github",
  "tools",
  "website",
  ".gitattributes",
  ".gitignore",
  "package.json",
];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === "node_modules") return [];

    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function shouldFormat(file) {
  const name = path.basename(file);
  const extension = path.extname(file);
  return formattedNames.has(name) || formattedExtensions.has(extension);
}

function normalize(source) {
  return `${source
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n*$/g, "")}\n`;
}

const changed = [];

const files = targetPaths
  .map((target) => path.join(root, target))
  .flatMap((target) => {
    try {
      return readdirSync(target, { withFileTypes: true }) ? walk(target) : [];
    } catch {
      return [target];
    }
  })
  .filter(shouldFormat);

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const formatted = normalize(source);

  if (source === formatted) continue;

  changed.push(path.relative(root, file));
  if (!checkOnly) writeFileSync(file, formatted);
}

if (changed.length && checkOnly) {
  console.error(`Formatting needed:\n${changed.join("\n")}`);
  process.exit(1);
}

console.log(checkOnly ? "Formatting check passed." : `Formatted ${changed.length} files.`);
