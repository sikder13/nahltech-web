import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { datasetReportPath, routes, siteUrl } from "./routes";

import en from "@/lib/i18n/dictionaries/en.json";

/**
 * `public/llms.txt` is a static file, and static files derived from the
 * dictionary rot: a meta description gets rewritten, the page changes, and
 * this file goes on describing what the site used to say. Nothing in the
 * build would notice.
 *
 * So the drift is caught here instead. Every line is checked against the
 * source it was taken from — the descriptor, the route registry, the page
 * metadata — which is the same guarantee the generated surfaces get.
 */
const txt = readFileSync(path.join(process.cwd(), "public/llms.txt"), "utf8");

/** The first sentence of a meta description, which is what the file lists. */
function firstSentence(text: string): string {
  return /^(.+?\.)(?:\s|$)/.exec(text)![1];
}

const keyPages: readonly [keyof typeof en.pages, string][] = [
  ["home", routes.home],
  ["services", routes.services],
  ["aiConsultancy", routes.aiConsultancy],
  ["aiSearchVisibility", routes.aiSearchVisibility],
  ["aiAutomation", routes.aiAutomation],
  ["webDevelopment", routes.webDevelopment],
  ["softwareDevelopment", routes.softwareDevelopment],
  ["pricing", routes.pricing],
  ["crawlmouse", routes.crawlmouse],
  ["hafsaSastho", routes.hafsaSastho],
  ["research", routes.research],
  ["about", routes.about],
  ["contact", routes.contact],
];

describe("llms.txt", () => {
  it("leads with the company name and the canonical descriptor", () => {
    // The descriptor verbatim, as a blockquote. Same string /about renders
    // and the Organization node is described by — an assistant reading this
    // file and one reading the page get the same sentence.
    expect(txt.startsWith("# Nahl Technologies\n")).toBe(true);
    expect(txt).toContain(`> ${en.about.intro}`);
  });

  it("lists every key page with its own metadata, not new prose", () => {
    // Hard rule 12 in file form: no sentence here was written for this file.
    for (const [key, route] of keyPages) {
      const page = en.pages[key] as { title: string; description: string };
      const line = `- [${page.title}](${siteUrl}${route}) — ${firstSentence(page.description)}`;
      expect(txt, key).toContain(line);
    }
  });

  it("links the dataset report under Research", () => {
    expect(txt).toContain("## Research");
    expect(txt).toContain(
      `(${siteUrl}${datasetReportPath}) — Open dataset: 187 small-business website audits, licensed CC BY 4.0.`,
    );
  });

  it("uses absolute https URLs and nothing else", () => {
    const hrefs = [...txt.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
    expect(hrefs.length).toBe(keyPages.length + 1);
    for (const href of hrefs) {
      expect(href, href).toMatch(new RegExp(`^${siteUrl}/`));
    }
  });

  it("points at no route that does not exist", () => {
    // Hard rule 7 applied to a file a crawler reads rather than a page a
    // visitor clicks. Every path here is a value from the route registry.
    const paths = [...txt.matchAll(/\]\(([^)]+)\)/g)].map(
      (m) => new URL(m[1]).pathname,
    );
    const known = new Set<string>([
      ...Object.values(routes),
      datasetReportPath,
    ]);
    for (const p of paths) {
      expect(known.has(p), p).toBe(true);
    }
  });
});
