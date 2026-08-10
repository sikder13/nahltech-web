import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Guard against a silent token collision.
 *
 * The semantic spacing scale in globals.css uses the suffixes sm, md, lg, xl,
 * 2xl and 3xl, which are also Tailwind's width-scale names — and spacing
 * wins. A max-width utility ending in one of those suffixes therefore
 * compiles to the spacing value — 1.5rem where 28rem was intended — and the
 * element collapses with no error anywhere. (The class name is spelled out
 * nowhere in this repo on purpose: Tailwind scans source files, so writing
 * it even inside a comment would emit the broken rule into the stylesheet.)
 *
 * This shipped once: the home hero and the pricing list both rendered a few
 * rem wide. Nothing in lint, tsc or the build catches it, so it is caught
 * here instead.
 */
const COLLIDING =
  /\b(?:max-w|min-w|max-h|min-h|w|h|size|basis)-(?:3xs|2xs|xs|sm|md|lg|xl|2xl|3xl)\b/g;

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      sourceFiles(full, found);
    } else if (/\.(tsx?|css)$/.test(entry) && !entry.endsWith(".test.ts")) {
      found.push(full);
    }
  }
  return found;
}

describe("design token collisions", () => {
  it("uses no width utility that resolves to the spacing scale", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles("src")) {
      const contents = readFileSync(file, "utf8");

      for (const [index, line] of contents.split("\n").entries()) {
        // The globals.css comment documents the rule and names examples.
        if (file.endsWith("globals.css")) continue;

        const matches = line.match(COLLIDING);
        if (matches) {
          offenders.push(`${file}:${index + 1} → ${matches.join(", ")}`);
        }
      }
    }

    expect(
      offenders,
      `Use max-w-prose or a max-w-(--container-*) token instead:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
