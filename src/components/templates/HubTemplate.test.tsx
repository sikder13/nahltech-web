import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HubTemplate } from "./HubTemplate";

import { CardGrid, ServiceCard } from "@/components/blocks/cards";
import en from "@/lib/i18n/dictionaries/en.json";

const fixture = {
  title: "[PLACEHOLDER: hub title]",
  intro: "[PLACEHOLDER: hub intro]",
  emptyLabel: "[PLACEHOLDER: nothing published yet]",
};

describe("HubTemplate", () => {
  it("renders the header and the card grid when it has children", () => {
    render(
      <HubTemplate {...fixture}>
        <CardGrid>
          <ServiceCard
            title="AI Consultancy"
            description="[PLACEHOLDER: summary]"
            href="/services/ai-consultancy"
            icon="analyze"
          />
        </CardGrid>
      </HubTemplate>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: fixture.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(fixture.intro)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "AI Consultancy" }),
    ).toHaveAttribute("href", "/services/ai-consultancy");
    expect(screen.queryByText(fixture.emptyLabel)).not.toBeInTheDocument();
  });

  it("falls back to the empty state instead of an empty grid", () => {
    render(<HubTemplate {...fixture} />);

    expect(screen.getByText(fixture.emptyLabel)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    // The header still renders, so the page is never a dead end.
    expect(
      screen.getByRole("heading", { level: 1, name: fixture.title }),
    ).toBeInTheDocument();
  });

  it("renders a multi-paragraph intro in order", () => {
    // The services hub leads with two paragraphs; every other hub passes one
    // string and must keep rendering exactly as before.
    const { container } = render(
      <HubTemplate {...fixture} intro={["First para.", "Second para."]} />,
    );
    const paragraphs = [...container.querySelectorAll("p")].map(
      (p) => p.textContent,
    );

    expect(paragraphs.slice(0, 2)).toEqual(["First para.", "Second para."]);
  });

  it("renders a footer under the grid", () => {
    render(
      <HubTemplate {...fixture} footer={<p>Anything else?</p>}>
        <CardGrid>
          <ServiceCard
            title="AI Consultancy"
            description="[PLACEHOLDER: summary]"
            href="/services/ai-consultancy"
            icon="analyze"
          />
        </CardGrid>
      </HubTemplate>,
    );

    expect(screen.getByText("Anything else?")).toBeInTheDocument();
  });
});

describe("services hub copy", () => {
  it("frames the five cards as examples, not a closed menu", () => {
    // The point of the rework: the old intro ended "Five services, one
    // method", which reads as the whole offer. If this assertion ever has to
    // change, the page has quietly become a menu again.
    expect(en.hubPages.services.intro).toContain("wider than any menu");
    expect(en.hubPages.services.introSecond).toContain(
      "five common shapes the work takes",
    );
    expect(en.hubPages.services.introSecond).toContain("that's normal");
    expect(en.hubPages.services.intro).not.toContain("Five services, one");
  });

  it("closes with an invitation that points at contact", () => {
    expect(en.hubPages.services.closingBody).toBe(
      "Working on something that doesn't fit a category? Most of our favorite projects didn't.",
    );
    expect(en.hubPages.services.closingLink).toBe("Tell us about it");
  });

  it("uses no banned word in any of the reworked copy", () => {
    // Rule 15 has no automated gate anywhere else in the repo, so the copy
    // this session added carries its own.
    const BANNED = [
      "empower",
      "leverage",
      "unlock",
      "transform",
      "harness",
      "cutting-edge",
      "innovative",
      "world-class",
    ];
    const copy = [
      ...Object.values(en.hubPages.services),
      en.pages.services.description,
      en.serviceContact.heading,
      en.serviceContact.body,
    ]
      .join(" ")
      .toLowerCase();

    for (const word of BANNED) expect(copy, word).not.toContain(word);
    // "solutions" as a standalone noun.
    expect(copy).not.toMatch(/\bsolutions?\b/);
  });
});
