import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const roots = ["src", "tests", "e2e"];
const categories = ["Unit / Business Logic", "Component / Module", "API / Service", "Integration", "Contract", "E2E"];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
}

function categoryFor(path) {
  const normalized = path.replaceAll("\\", "/");

  if (normalized.startsWith("e2e/")) return "E2E";
  if (normalized.startsWith("tests/contracts/")) return "Contract";
  if (normalized.startsWith("tests/api/")) return "API / Service";
  if (normalized.startsWith("tests/integration/")) return "Integration";
  if (normalized.endsWith("/frogSearch.test.ts") || normalized.endsWith("/frogCatalog.test.ts")) {
    return "Unit / Business Logic";
  }
  if (normalized.startsWith("src/")) return "Component / Module";

  throw new Error(`Cannot categorize test file: ${path}`);
}

const counts = Object.fromEntries(categories.map((category) => [category, { files: 0, tests: 0 }]));
const testDeclaration = /^\s*(?:it|test)\s*\(/gm;

for (const root of roots) {
  for (const path of await collectFiles(root)) {
    const content = await readFile(path, "utf8");
    const category = categoryFor(path);
    const count = content.match(testDeclaration)?.length ?? 0;
    counts[category].files += 1;
    counts[category].tests += count;
  }
}

const total = Object.values(counts).reduce((sum, value) => sum + value.tests, 0);
console.log("Test count by category");

for (const category of categories) {
  const value = counts[category];
  console.log(`${category}: ${value.tests} tests in ${value.files} files`);
}

console.log(`Total: ${total} tests`);
