#!/usr/bin/env node
/**
 * Mursix is frozen.
 *
 * The Mursix dashboard shipped with a printed letter, and that letter
 * describes this page as it is. Template 2 stays a living template for new
 * companies, so Mursix has no byte pins; this rendered-page gate is what
 * holds it still while the code around it grows. This check runs in CI
 * after `next build` and compares the built Mursix page with a golden copy
 * of the page as it shipped.
 *
 * It compares the rendered body with scripts removed, which is everything a
 * reader can see. It ignores only what legitimately differs between builds:
 * hashed asset file names under /_next/static, next/font's hashed class
 * names, the hash suffix on CSS-module class names (which changes when a
 * module file moves, while its styles do not), and React's generated element
 * ids (aria wiring such as _R_4kp..._, which renumber whenever the component
 * tree around them grows, while the label pairs they connect stay
 * self-consistent). Any other difference fails the build and prints where
 * it starts.
 *
 * Usage: npm run build && node scripts/check-mursix-frozen.mjs
 * To refresh the golden file after a deliberate, founder-approved change to
 * Mursix: node scripts/check-mursix-frozen.mjs --write
 */
import { readFileSync, writeFileSync } from "node:fs";

const TOKEN = "mursix-corporation-6fba84c074";
const BUILT = `.next/server/app/m2/${TOKEN}.html`;
const GOLDEN = "tests/golden/mursix-body.html";

export function visibleBody(html) {
  const body = html.slice(
    html.indexOf("<body"),
    html.lastIndexOf("</body>") + 7,
  );
  return body
    .replace(/<script\b[\s\S]*?<\/script>/g, "")
    .replace(/\/_next\/static\/[^"')\s]+/g, "/_next/static/[asset]")
    .replace(/__(className|variable)_[a-z0-9]+/g, "__$1_[font]")
    .replace(
      /\b([A-Z][A-Za-z0-9]*_[A-Za-z0-9]+)__[A-Za-z0-9_-]{5}\b/g,
      "$1__[module]",
    )
    .replace(/_R_[A-Za-z0-9]+_/g, "_R_[id]_");
}

/**
 * Pairing integrity: every aria-labelledby and aria-describedby on the built
 * page must resolve to an element id in the same document. The golden
 * comparison normalizes React's generated ids, so this check is what keeps
 * that normalization provably safe: wiring is verified here on the real ids,
 * before they are normalized away.
 */
function checkAriaPairs(html) {
  const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
  const missing = [];
  for (const m of html.matchAll(
    / aria-(?:labelledby|describedby)="([^"]+)"/g,
  )) {
    for (const ref of m[1].split(/\s+/)) {
      if (ref && !ids.has(ref)) missing.push(ref);
    }
  }
  if (missing.length > 0) {
    console.error(
      `Aria reference(s) with no matching id: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

const raw = readFileSync(BUILT, "utf8");
checkAriaPairs(raw);
const built = visibleBody(raw);

if (process.argv.includes("--write")) {
  writeFileSync(GOLDEN, built);
  console.log(`Wrote ${GOLDEN} (${built.length} characters).`);
  process.exit(0);
}

const golden = readFileSync(GOLDEN, "utf8");
if (built === golden) {
  console.log(`Mursix is unchanged: the built page matches ${GOLDEN} exactly.`);
  process.exit(0);
}

let i = 0;
while (i < built.length && built[i] === golden[i]) i += 1;
console.error(
  "Mursix has changed. It is frozen: it shipped with a printed letter.",
);
console.error(`First difference at character ${i}:`);
console.error(`  production: …${golden.slice(Math.max(0, i - 80), i + 120)}…`);
console.error(`  this build: …${built.slice(Math.max(0, i - 80), i + 120)}…`);
process.exit(1);
