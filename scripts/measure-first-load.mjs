/**
 * First-load JS on `/`, measured the way ARCH-1 §7 specifies.
 *
 * Sum the `.js` entries from `build-manifest.rootMainFiles` plus the
 * `app-build-manifest.pages` entries for `/layout`, `/[locale]/layout` and
 * `/[locale]/page`, gzip each at level 9, and add the compressed sizes. CSS is
 * excluded.
 *
 * The method is fixed so successive numbers are comparable. Run after a
 * production build:  node scripts/measure-first-load.mjs
 */
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"));

const buildManifest = read(".next/build-manifest.json");
const appManifest = read(".next/app-build-manifest.json");

const PAGE_KEYS = ["/layout", "/[locale]/layout", "/[locale]/page"];

const files = new Set();
for (const file of buildManifest.rootMainFiles ?? []) files.add(file);
for (const key of PAGE_KEYS) {
  for (const file of appManifest.pages?.[key] ?? []) files.add(file);
}

const rows = [];
let total = 0;

for (const file of [...files].filter((f) => f.endsWith(".js")).sort()) {
  const bytes = readFileSync(path.join(root, ".next", file));
  const gz = gzipSync(bytes, { level: 9 }).length;
  total += gz;
  rows.push({ file, raw: bytes.length, gz });
}

rows.sort((a, b) => b.gz - a.gz);
const kb = (n) => (n / 1024).toFixed(1).padStart(7);

console.log("gzip(9)      raw  file");
for (const r of rows) {
  console.log(`${kb(r.gz)} kB ${kb(r.raw)} kB  ${r.file}`);
}
/**
 * Ratified 13 Aug 2026, replacing 120 kB. The original was set before the
 * framework cost was measured: React + Next alone is 100.3 kB and Framer
 * Motion adds 27.7 kB, so the locked stack is 128 kB before any application
 * code. ARCH-1 §7 carries the itemised basis. This ceiling is only ~1.5 kB
 * above the measurement that justified it, so it still bites.
 */
const TARGET_KB = 145;

console.log("-".repeat(60));
console.log(
  `${kb(total)} kB TOTAL first-load JS on /   (ceiling ${TARGET_KB.toFixed(1)} kB)`,
);

const delta = total - TARGET_KB * 1024;
console.log(
  delta > 0
    ? `${kb(delta)} kB OVER the ceiling`
    : `${kb(-delta)} kB of headroom`,
);
process.exit(delta > 0 ? 1 : 0);
