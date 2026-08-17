import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { siteUrl } from "@/lib/routes";

/**
 * Every indexable route must declare its own canonical.
 *
 * This is the one piece of metadata that carries real risk at cutover. The
 * `.vercel.app` alias keeps serving after the domain moves, so the same page
 * is reachable at two hostnames; the canonical is what tells a crawler which
 * one counts. Without it both get indexed and they compete.
 *
 * It was missing site-wide until 17 Aug, and nothing failed — metadataBase
 * was set, which resolves relative URLs but emits no canonical on its own.
 * The two are easy to confuse, which is exactly why this exists.
 *
 * A relative canonical in the locale layout is not an option and must not be
 * reintroduced: `alternates: { canonical: "./" }` resolves against the
 * internal route, producing `/en/about` — a URL that 308s to `/about`. A
 * canonical pointing at a redirect is worse than none at all.
 */

const APP = path.join(process.cwd(), "src/app/[locale]");

function pageFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) pageFiles(full, found);
    else if (entry.name === "page.tsx") found.push(full);
  }
  return found;
}

/**
 * The catch-all under `[locale]` exists only to call `notFound()`, so the
 * locale shell renders around the 404 instead of Next's unstyled fallback. A
 * 404 must not name a canonical — it would be telling a crawler that a page
 * which does not exist is the preferred version of something.
 */
const NOT_INDEXABLE = ["[...unmatched]"];

describe("canonical URLs", () => {
  const pages = pageFiles(APP).filter(
    (file) => !NOT_INDEXABLE.some((segment) => file.includes(segment)),
  );

  it("finds every route page", () => {
    // Guards the walker itself: an empty list would make the next test pass
    // for the wrong reason.
    expect(pages.length).toBeGreaterThanOrEqual(20);
  });

  it("declares alternates.canonical on every route", () => {
    const missing = pages
      .filter(
        (file) =>
          !/alternates:\s*\{\s*canonical:/.test(readFileSync(file, "utf8")),
      )
      .map((file) => path.relative(process.cwd(), file));

    expect(
      missing,
      `routes without a canonical: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("never uses a relative canonical, which would resolve under /en", () => {
    for (const file of pages) {
      const source = readFileSync(file, "utf8");
      expect(source, path.relative(process.cwd(), file)).not.toMatch(
        /canonical:\s*["'`]\.\.?\//,
      );
    }
  });

  it("keeps metadataBase pointing at the production origin", () => {
    // The canonical values are absolute paths; metadataBase supplies the
    // origin. If it ever pointed at a preview host, every canonical would
    // silently follow it there.
    const layout = readFileSync(
      path.join(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );
    expect(layout).toContain("metadataBase");
    expect(siteUrl).toBe("https://nahltech.com");
  });
});
