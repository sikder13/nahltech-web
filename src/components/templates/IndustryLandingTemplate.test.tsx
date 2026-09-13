import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeTemplate } from "./HomeTemplate";
import { IndustryLandingTemplate } from "./IndustryLandingTemplate";
import { LocalLandingTemplate } from "./LocalLandingTemplate";

import ServicesPage from "@/app/[locale]/services/page";
import en from "@/lib/i18n/dictionaries/en.json";
import {
  bookingCta,
  canadaFundingGuidePath,
  contactDetails,
  manufacturingPiecePaths,
  routes,
} from "@/lib/routes";

/**
 * The approved draft, as supplied — an independent copy, not read from the
 * dictionary. The dictionary stores linked sentences split around their
 * anchors, so the failure this catches is a join that renders wrong: a
 * missing space before a link, a doubled one after it, a colon that ends up
 * inside the anchor. Every one of those still renders, and still reads as
 * nearly right.
 */
const draft = {
  h1: "AI and automation for manufacturers",
  lead: [
    "Nahl Technologies is an AI consulting and implementation firm in Indianapolis that works with small and mid-size manufacturers: job shops and contract manufacturers, medical device makers, custom machine builders, and plastics processors. We find where AI genuinely recovers money in a plant's front office and paperwork, then build it, with ROI math you can check against your own books before anything gets built.",
    "Most of Indiana is within a morning's drive of us, and we come to the floor. We also work remotely with manufacturers across North America, and our published research covers exactly the problems this page describes.",
  ],
  headings: [
    "The execution gap on the shop floor's other side",
    "What we build, shown in numbers",
    "How an engagement runs",
    "Grant money, plainly",
    "Frequently asked questions",
    "Start with the free 30-minute scan.",
  ],
  paragraphs: [
    "Manufacturers automated the floor a generation before everyone else. Cobots, CNC, vision systems. What mostly has not been automated is the other side of the wall: quoting from RFQs, proposal engineering, quality system paperwork, and the process data that gets collected and never read. That is where we work. The machines are rarely the constraint anymore. The office around them is.",
    "One credential worth stating plainly, because manufacturers in regulated work ask: before founding this firm, our CEO built software inside regulated digital health environments, where documentation is not an add-on to the work but the shape of it. FDA-registered and ISO 13485 shops will recognize what that experience means.",
    "We publish full worked engagements, with the math, the assumptions labeled, and the scenario where the project disappoints included on purpose:",
    "Every engagement starts with a free 30-minute scan: we look at your quoting, intake, paperwork, or process data and name the two or three places AI would most likely pay for itself. If a build makes sense, a $2,500 audit produces the measured baseline and a fixed-price scope, and the fee is fully credited toward your first project. Automation builds start at $7,500, with a written scope, live inside 75 days or your money back. Every price is published on our pricing page. If the honest answer after the scan is that nothing is worth building yet, we say that too, and it costs you half an hour.",
    "Two programs matter for the manufacturers we serve, and both fund exactly this category of work. Indiana's Manufacturing Readiness Grants require a one-to-one company match, which means a $50,000 award deploys $100,000 of capability, and awards have repeatedly funded software that cuts lead times and cycle times. Quoting time is a lead time. In Canada, NRC IRAP funds technical development at manufacturers through an advisor-led process that starts with a phone call, and our Canadian AI funding guide covers what is currently open, including the program most articles still recommend that closed in 2024.",
    "Bring your quoting inbox, your CAPA backlog, or the process data nobody reads. If there is nothing worth building, we will say so.",
  ],
  bullets: [
    "The Quote That Took Six Days: AI-assisted quoting for a Kokomo job shop, built on the published finding that quotes returned in two hours win over 90% and quotes after five days win under 5%.",
    "The Proposal That Ate March: proposal engineering for a custom machine builder, where every quote is an engineering project and seventy percent of that engineering, by the win rate, is unpaid.",
    "ISO 13485 Paperwork and AI: What Actually Gets Automated: the honest map of what AI drafts, what must stay human, and the tool-validation cost nobody prices in.",
    "The Scrap Data You Already Collect: why molders quote 3 to 5% scrap, measure closer to 10%, and already own the data that closes the gap.",
  ],
  faq: [
    [
      "Do you work with small shops, or only large manufacturers?",
      "Small and mid-size is our lane: roughly 10 to 200 employees. Big enough that quoting, paperwork, and process data eat real hours; small enough that nobody has time to read the data or fix the workflow. Enterprise-scale programs belong with enterprise-scale firms, and we say so when that is the honest answer.",
    ],
    [
      "Do you actually come to the plant?",
      "In Indiana, yes. Most of the state is within a morning's drive of Indianapolis, and the scan and audit work better when we have seen the floor and the office it feeds. Outside driving range we work remotely, on video, with your team walking us through the workflow.",
    ],
    [
      "What does this cost?",
      "The first 30 minutes are free. The audit is $2,500, fully credited toward your first project within 90 days. Automation builds start at $7,500 with a fixed written scope and a 75-day delivery guarantee. All prices are published on our site.",
    ],
    [
      "Can AI really be used under ISO 13485 or FDA quality systems?",
      "Yes, with a hard boundary: AI drafts, retrieves, and monitors; qualified people approve, sign, and decide. We wrote the honest version of that answer, including what must never be automated, in the ISO 13485 piece linked above.",
    ],
  ],
  /** The three inbound placements, approved verbatim in the same relay. */
  inbound: {
    home: "AI for manufacturers",
    servicesHub:
      "We work extensively with manufacturers: job shops, machine builders, device makers, and processors.",
    aiConsultingIndianapolis:
      "Manufacturers get their own front door: AI and automation for manufacturers.",
  },
} as const;

/** Rendered text of every paragraph and list item, whitespace untouched. */
function blockText(container: HTMLElement): string[] {
  return [...container.querySelectorAll("p, li")].map(
    (node) => node.textContent ?? "",
  );
}

describe("IndustryLandingTemplate renders the approved draft", () => {
  it("carries the h1, the lead and every section heading in order", () => {
    const { container } = render(
      <IndustryLandingTemplate t={en} content={en.manufacturing} />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: draft.h1 }),
    ).toBeInTheDocument();
    expect(
      [...container.querySelectorAll("h2")].map((node) => node.textContent),
    ).toEqual(draft.headings);

    const text = blockText(container);
    for (const paragraph of draft.lead) expect(text).toContain(paragraph);
  });

  it("renders every paragraph and bullet character for character", () => {
    const { container } = render(
      <IndustryLandingTemplate t={en} content={en.manufacturing} />,
    );
    const text = blockText(container);

    for (const paragraph of draft.paragraphs) {
      expect(text, paragraph.slice(0, 48)).toContain(paragraph);
    }
    // In the draft's order, not merely present.
    const bullets = text.filter((line) =>
      draft.bullets.some((bullet) => bullet === line),
    );
    expect(bullets).toEqual(draft.bullets);
  });

  it("renders all four questions with their answers", () => {
    render(<IndustryLandingTemplate t={en} content={en.manufacturing} />);

    for (const [question, answer] of draft.faq) {
      const button = screen.getByRole("button", { name: question });
      const panel = document.getElementById(
        button.getAttribute("aria-controls")!,
      );
      expect(panel?.textContent).toBe(answer);
    }
  });

  it("links each piece on its title, and the pricing and funding links on their anchors", () => {
    render(<IndustryLandingTemplate t={en} content={en.manufacturing} />);

    const expected: [string, string][] = [
      ["The Quote That Took Six Days", manufacturingPiecePaths.quoting],
      ["The Proposal That Ate March", manufacturingPiecePaths.proposals],
      [
        "ISO 13485 Paperwork and AI: What Actually Gets Automated",
        manufacturingPiecePaths.iso13485,
      ],
      ["The Scrap Data You Already Collect", manufacturingPiecePaths.scrap],
      ["our pricing page", routes.pricing],
      ["our Canadian AI funding guide", canadaFundingGuidePath],
    ];

    for (const [anchor, href] of expected) {
      expect(screen.getByRole("link", { name: anchor })).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  it("closes on the booking link and the phone number", () => {
    render(<IndustryLandingTemplate t={en} content={en.manufacturing} />);

    expect(screen.getByRole("link", { name: "Book the scan" })).toHaveAttribute(
      "href",
      bookingCta.href,
    );
    expect(
      screen.getByRole("link", { name: /\(317\) 507-4303/ }),
    ).toHaveAttribute("href", contactDetails.phoneHref);
    expect(screen.getByText("— a real person answers")).toBeInTheDocument();
  });
});

describe("inbound links to /manufacturing", () => {
  it("home: a card in the destinations grid, on the approved anchor", () => {
    render(<HomeTemplate t={en} />);

    const grid = screen.getByRole("region", { name: en.home.services.heading });
    const link = within(grid).getByRole("link", { name: draft.inbound.home });
    expect(link).toHaveAttribute("href", routes.manufacturing);
    // A card title, so a heading — the same rank as its siblings.
    expect(link.closest("h3")).not.toBeNull();
  });

  it("/services: one line under the grid, beside the other front door", async () => {
    const { container } = render(
      await ServicesPage({ params: Promise.resolve({ locale: "en" }) }),
    );

    const line = [...container.querySelectorAll("p")].find(
      (node) => node.textContent === draft.inbound.servicesHub,
    );
    expect(line, "the approved sentence renders whole").toBeDefined();
    expect(within(line!).getByRole("link")).toHaveAttribute(
      "href",
      routes.manufacturing,
    );
    expect(within(line!).getByRole("link")).toHaveTextContent(
      /^manufacturers$/,
    );

    // Directly after the Indianapolis line, before the catch-all.
    const previous = line!.previousElementSibling;
    expect(previous?.querySelector("a")).toHaveAttribute(
      "href",
      routes.aiConsultingIndianapolis,
    );
  });

  it("/ai-consulting-indianapolis: the last sentence of “Who this is for”", () => {
    render(
      <LocalLandingTemplate t={en} content={en.aiConsultingIndianapolis} />,
    );

    const heading = screen.getByRole("heading", {
      level: 2,
      name: en.aiConsultingIndianapolis.audience.heading,
    });
    const section = heading.closest("section")!;
    const paragraphs = section.querySelectorAll("p");
    const last = paragraphs[paragraphs.length - 1];

    expect(last.textContent).toBe(draft.inbound.aiConsultingIndianapolis);
    expect(
      within(last).getByRole("link", {
        name: "AI and automation for manufacturers",
      }),
    ).toHaveAttribute("href", routes.manufacturing);
  });
});
