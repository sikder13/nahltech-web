#!/usr/bin/env node
/**
 * No GitHub link on any prospect dashboard.
 *
 * The dashboard footers deliberately omit the GitHub profile (removed after
 * EckCo and Mursix first shipped with it, PRs #3 and #4). This check runs in
 * CI after the build and scans every rendered dashboard page, template 1 and
 * template 2, for a github.com href anywhere on the page, not just the
 * footer. A component test covers the FooterBase prop; this covers the page
 * a reader actually receives, so a future page or template that forgets the
 * hideSocial prop fails the build.
 *
 * Usage: npm run build && node scripts/check-no-github.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIRS = [".next/server/app/m", ".next/server/app/m2"];
let pages = 0;
let failed = false;

for (const dir of DIRS) {
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".html")) continue;
    pages += 1;
    const html = readFileSync(join(dir, file), "utf8");
    const hits = [...html.matchAll(/href="[^"]*github\.com[^"]*"/g)];
    if (hits.length > 0) {
      failed = true;
      console.error(
        `${dir}/${file}: ${hits.length} github.com href(s): ${hits[0][0]}`,
      );
    }
  }
}

if (pages === 0) {
  console.error("No rendered dashboard pages found. Run next build first.");
  process.exit(1);
}
if (failed) process.exit(1);
console.log(
  `No github.com href on any of the ${pages} rendered dashboard pages.`,
);
