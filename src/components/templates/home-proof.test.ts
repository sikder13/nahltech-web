import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import en from "@/lib/i18n/dictionaries/en.json";
import { datasetReportPath, datasetReportSlug } from "@/lib/routes";

/**
 * The proof bar states facts about our own work, so each line has to be
 * checkable against the thing it cites.
 *
 * This exists because one was not. The research slot read "The Indianapolis
 * AI Visibility Report — our own published data" and cited a report whose
 * fieldwork had been deferred: a confident claim, on the home page, about a
 * document that did not exist, next to a heading that says "Don't take our
 * word for it. Check our work." Nothing in the build could catch it, because
 * the copy was internally consistent and the link resolved — it pointed at
 * the research hub, which is real.
 *
 * So the number is now tied to the artifact that carries it. A figure on the
 * home page and a figure in the source document cannot drift apart without
 * failing here.
 */

const REPORT = path.join(
  process.cwd(),
  `content/research/${datasetReportSlug}.mdx`,
);

describe("home proof bar: the research line", () => {
  it("cites an artifact that exists and is published", () => {
    expect(existsSync(REPORT), `${REPORT} is missing`).toBe(true);
    const source = readFileSync(REPORT, "utf8");
    // A drafted artifact is not published data, whatever the line says.
    expect(source).toMatch(/^draft:\s*false$/m);
  });

  it("quotes a figure the artifact actually reports", () => {
    const line = en.home.proof.items.research;
    const figures = line.match(/\d[\d,]*/g) ?? [];
    expect(figures.length, `no figure in "${line}"`).toBeGreaterThan(0);

    const source = readFileSync(REPORT, "utf8");
    for (const figure of figures) {
      expect(source, `home page says ${figure}; the report does not`).toContain(
        figure,
      );
    }
  });

  it("links to the report itself rather than the hub", () => {
    // The visitor taps a number and should arrive at that number, not at a
    // list of documents one of which contains it.
    expect(datasetReportPath).toBe(`/research/${datasetReportSlug}`);
  });

  it("no longer claims a report that was never written", () => {
    // Named explicitly: this exact string shipped, and the deferred fieldwork
    // means it must not come back without the report coming with it.
    expect(JSON.stringify(en)).not.toContain("Indianapolis AI Visibility");
  });

  it("leaves the other three proof lines pointing at checkable things", () => {
    // Not asserting their wording — only that the slot is filled, so a future
    // edit cannot blank one and leave a bare bullet on the home page.
    for (const key of ["product", "app", "method"] as const) {
      expect(en.home.proof.items[key].length, key).toBeGreaterThan(10);
    }
  });
});
