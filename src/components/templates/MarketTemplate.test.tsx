import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketTemplate } from "./MarketTemplate";

import en from "@/lib/i18n/dictionaries/en.json";
import {
  canadaFundingGuidePath,
  gulfGuidePaths,
  gulfStudyPath,
  contactDetails,
  nzGuidePaths,
  nzTourismLinkPaths,
  nzTourismPageLinkPaths,
} from "@/lib/routes";

/**
 * The concentration passage is stored split around its link, so what has to
 * be checked is the rendered paragraph, not the dictionary: a join that drops
 * the space before the anchor, or doubles it after, still renders and still
 * reads as nearly right. An independent copy of the approved text, not one
 * read back from the dictionary.
 */
const approved =
  "Most of our Canadian conversations come from Ontario's manufacturing belt and the Prairie cities: Toronto and the towns around it, Guelph, Cambridge, Peterborough, Winnipeg. That is not an accident. Mid-size Canadian cities are full of manufacturers and service firms too small to hire a $200,000 AI specialist and too busy to become one, which is exactly who we built our engagement model for. Everything runs remotely, in your time zone, and our study of how AI funding actually works in Canada right now is where many of those conversations start.";

function renderCanada() {
  return render(
    <MarketTemplate
      t={en}
      market="marketCanada"
      content={en.markets.canada}
      trailingLinkHref={canadaFundingGuidePath}
    />,
  );
}

describe("MarketTemplate — the Canada concentration passage", () => {
  it("renders as its own section between the execution gap and the practical questions", () => {
    const { container } = renderCanada();

    const headings = [...container.querySelectorAll("h2")].map(
      (node) => node.textContent,
    );
    expect(headings.slice(0, 3)).toEqual([
      "The execution gap, Canadian edition",
      "Where our Canadian work concentrates",
      "Practical things Canadian clients ask about",
    ]);
  });

  it("renders the approved paragraph character for character, with the link inside it", () => {
    renderCanada();

    const section = screen
      .getByRole("heading", {
        level: 2,
        name: "Where our Canadian work concentrates",
      })
      .closest("section")!;
    const paragraphs = section.querySelectorAll("p");

    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0].textContent).toBe(approved);
    expect(
      within(paragraphs[0]).getByRole("link", {
        name: "study of how AI funding actually works in Canada right now",
      }),
    ).toHaveAttribute("href", canadaFundingGuidePath);
  });

  it("leaves the page's existing funding-guide link where it was", () => {
    renderCanada();

    expect(
      screen.getByRole("link", { name: "Canada AI funding guide" }),
    ).toHaveAttribute("href", canadaFundingGuidePath);
  });

  it("keeps the words when a page supplies no destination", () => {
    // The passage is the section's body. Losing the href must not lose the
    // sentence — it renders unlinked instead.
    const { container } = render(
      <MarketTemplate
        t={en}
        market="marketCanada"
        content={en.markets.canada}
      />,
    );

    const texts = [...container.querySelectorAll("p")].map(
      (node) => node.textContent,
    );
    expect(texts).toContain(approved);
    expect(
      screen.queryByRole("link", {
        name: "study of how AI funding actually works in Canada right now",
      }),
    ).toBeNull();
  });
});

describe("MarketTemplate — the Canada currency note and open-programs paragraph", () => {
  it("renders the currency note directly after the price anchor line", () => {
    renderCanada();

    const anchor = screen.getByText(/^For context: our full audit costs less/);
    const note = screen.getByText(/^Prices are in US dollars\./);

    expect(anchor.nextElementSibling).toBe(note);
    expect(note.textContent).toBe(
      "Prices are in US dollars. At current rates a $2,500 audit is about CA$3,400 and a $15,000 build is about CA$20,500; we invoice in USD and the conversion is yours to check on the day.",
    );
  });

  it("renders the open-programs paragraph directly under the funding bullet's list", () => {
    renderCanada();

    const paragraph = screen.getByText(/^Funding changes monthly\./);
    const list = paragraph.previousElementSibling;

    expect(list?.tagName).toBe("UL");
    expect(list?.lastElementChild?.textContent).toContain(
      "The funding question",
    );
    expect(paragraph.textContent).toBe(
      "Funding changes monthly. As of October 2026 the open doors are NRC IRAP, BDC LIFT for businesses over $1 million in revenue, Mitacs AI Advantage placements, and the Regional AI Initiative in the Prairies and Quebec. Our guide to AI funding for Canadian small businesses is re verified every month and dates every claim.",
    );
  });
});

describe("MarketTemplate — the Gulf page's Saudi guides paragraph", () => {
  function renderGulf() {
    return render(
      <MarketTemplate
        t={en}
        market="marketGulf"
        content={en.markets.gulf}
        trailingLinkHref={gulfStudyPath}
        hrefs={gulfGuidePaths}
      />,
    );
  }

  it("renders the approved paragraph with both links, after the research sentence", () => {
    renderGulf();

    const paragraph = screen.getByText(/^Two things decide a Saudi project/);
    expect(paragraph.textContent).toBe(
      "Two things decide a Saudi project's budget in 2026 that have nothing to do with us: the ZATCA e invoicing wave your business falls into, and the PDPL rules that apply to the data your site collects. We wrote both up for small businesses: funding and support for digital and AI projects in Saudi Arabia and PDPL compliance for a small business website.",
    );
    expect(
      within(paragraph)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual([gulfGuidePaths.saudiFunding, gulfGuidePaths.pdpl]);

    const research = screen.getByText(/^We also publish original research/);
    expect(
      research.compareDocumentPosition(paragraph) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders the currency note directly after the price anchor line", () => {
    renderGulf();

    const anchor = screen.getByText(/^For context: our full audit typically/);
    expect(anchor.nextElementSibling?.textContent).toBe(
      "Prices are in US dollars. A $2,500 audit is about SAR 9,400 or AED 9,200; a $15,000 build is about SAR 56,000 or AED 55,000. We invoice in USD.",
    );
  });
});

describe("MarketTemplate — the New Zealand tourism package page", () => {
  function renderNz() {
    return render(
      <MarketTemplate
        t={en}
        market="nzTourism"
        content={{
          ...en.nzTourism,
          cta: {
            heading: en.ctaBlock.heading,
            body: en.nzTourism.cta.body,
            primaryLabel: en.cta.bookCall,
          },
        }}
        hrefs={nzTourismPageLinkPaths}
      />,
    );
  }

  it("heads the page with the approved h1 and intro", () => {
    renderNz();

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Websites and AI visibility for New Zealand tourism operators",
    );
    expect(
      screen.getByText(/^We rebuild the homepage of owner run tour/),
    ).toBeTruthy();
  });

  it("numbers the four steps and bullets the rest", () => {
    renderNz();

    const steps = screen
      .getByRole("heading", { name: "How it works" })
      .closest("section")!;
    const ordered = within(steps).getAllByRole("list");
    expect(ordered).toHaveLength(1);
    expect(ordered[0].tagName).toBe("OL");
    expect(within(ordered[0]).getAllByRole("listitem")).toHaveLength(4);

    const included = screen
      .getByRole("heading", { name: "What you get for NZ$1,490" })
      .closest("section")!;
    expect(within(included).getByRole("list").tagName).toBe("UL");
    expect(within(included).getAllByRole("listitem")).toHaveLength(6);
  });

  it("links the four guides and nothing beneath /nz", () => {
    const { container } = renderNz();

    const guides = screen
      .getByRole("heading", { name: "Guides for New Zealand operators" })
      .closest("section")!;
    expect(
      within(guides)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(Object.values(nzGuidePaths));

    for (const link of container.querySelectorAll("a")) {
      expect(link.getAttribute("href")).not.toMatch(/^\/nz\//);
    }
  });

  it("closes on the site's booking block with the approved line", () => {
    renderNz();

    expect(
      screen.getByRole("heading", { name: en.ctaBlock.heading }),
    ).toBeTruthy();
    const line = screen.getByText(/^Questions first\?/);
    expect(line.textContent).toBe(
      "Questions first? Email us and we will reply within one New Zealand business day.",
    );
    // The address the footer and /contact use, opened in the visitor's own
    // mail app rather than a new tab.
    const email = within(line).getByRole("link", { name: "Email us" });
    expect(email.getAttribute("href")).toBe(contactDetails.emailHref);
    expect(email.getAttribute("href")).toBe(`mailto:${en.footer.email}`);
    expect(email.hasAttribute("target")).toBe(false);
    expect(screen.getByRole("link", { name: en.cta.bookCall })).toBeTruthy();
  });
});

describe("MarketTemplate — the New Zealand page's tourism paragraph", () => {
  it("renders the approved paragraph after the price anchor, with its three links", () => {
    render(
      <MarketTemplate
        t={en}
        market="marketNewZealand"
        content={en.markets.newZealand}
        hrefs={nzTourismLinkPaths}
      />,
    );

    const paragraph = screen.getByText(/^For tour, activity and cellar door/);
    expect(paragraph.textContent).toBe(
      "For tour, activity and cellar door operators we offer one fixed price package: a homepage rebuild and AI visibility setup for NZ$1,490, with a private preview before you pay. See the tourism operator package. Our guides cover what booking platforms charge NZ operators and how to get named in AI travel answers.",
    );
    expect(
      within(paragraph)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/nz", nzGuidePaths.commission, nzGuidePaths.aiSearch]);

    const anchor = screen.getByText(/^For context: a full audit costs less/);
    expect(
      anchor.compareDocumentPosition(paragraph) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
