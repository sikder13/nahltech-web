import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketsLine } from "./MarketsLine";

import en from "@/lib/i18n/dictionaries/en.json";
import { routes } from "@/lib/routes";

/**
 * The assembled sentence, pinned as a reader meets it.
 *
 * `markets.test.ts` checks the same string from the data side; this checks it
 * from the DOM, because the two can disagree — a stray space around a link, a
 * comma rendered outside the anchor, a fragment that swallows punctuation.
 * The founder approved a sentence, not a set of anchors, so what the page
 * says has to be that sentence character for character.
 */
const APPROVED =
  "We also work remotely with businesses in Canada, the Gulf region, " +
  "Central Asia, and New Zealand.";

describe("MarketsLine", () => {
  it("renders the approved sentence exactly", () => {
    const { container } = render(<MarketsLine t={en} />);
    expect(container.textContent).toBe(APPROVED);
  });

  it("links every market on its own anchor text", () => {
    render(<MarketsLine t={en} />);

    for (const [anchor, href] of [
      ["Canada", routes.marketCanada],
      ["the Gulf region", routes.marketGulf],
      ["Central Asia", routes.marketCentralAsia],
      ["New Zealand", routes.marketNewZealand],
    ] as const) {
      expect(screen.getByRole("link", { name: anchor })).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  it("keeps the punctuation outside the anchors", () => {
    // An anchor that swallows its trailing comma reads as "Canada," to a
    // screen reader and to anything parsing the link text — including the
    // crawl check, which groups editorial links by anchor text.
    render(<MarketsLine t={en} />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.textContent).not.toMatch(/[.,]/);
    }
  });
});
