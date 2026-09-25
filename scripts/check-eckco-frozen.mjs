#!/usr/bin/env node
/**
 * EckCo is frozen.
 *
 * The EckCo dashboard shipped with a printed letter, and that letter describes
 * this page as it is. So the page must not change: not its copy, not its
 * layout, not its behavior. This check runs in CI after `next build` and
 * compares the built EckCo page with a golden copy of the production output
 * taken when it shipped.
 *
 * It compares the rendered body with scripts removed, which is everything a
 * reader can see. It ignores only what legitimately differs between builds:
 * hashed asset file names under /_next/static, next/font's hashed class
 * names, and the hash suffix on CSS-module class names (which changes when a
 * module file moves, while its styles do not). The frozen CSS module itself
 * is held byte-identical by the template 1 tests. Any other difference fails
 * the build and prints where it starts.
 *
 * Usage: npm run build && node scripts/check-eckco-frozen.mjs
 * To refresh the golden file after a deliberate, founder-approved change to
 * EckCo: node scripts/check-eckco-frozen.mjs --write
 */
import { readFileSync, writeFileSync } from "node:fs";

const TOKEN = "eckco-plastics-inc-5481eb6929";
const BUILT = `.next/server/app/m/${TOKEN}.html`;
const GOLDEN = "tests/golden/eckco-body.html";

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
    );
}

const built = visibleBody(readFileSync(BUILT, "utf8"));

if (process.argv.includes("--write")) {
  writeFileSync(GOLDEN, built);
  console.log(`Wrote ${GOLDEN} (${built.length} characters).`);
  process.exit(0);
}

const golden = readFileSync(GOLDEN, "utf8");
if (built === golden) {
  console.log(`EckCo is unchanged: the built page matches ${GOLDEN} exactly.`);
  process.exit(0);
}

let i = 0;
while (i < built.length && built[i] === golden[i]) i += 1;
console.error(
  "EckCo has changed. It is frozen: it shipped with a printed letter.",
);
console.error(`First difference at character ${i}:`);
console.error(`  production: …${golden.slice(Math.max(0, i - 80), i + 120)}…`);
console.error(`  this build: …${built.slice(Math.max(0, i - 80), i + 120)}…`);
process.exit(1);
