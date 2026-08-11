import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeTemplate } from "./HomeTemplate";

import en from "@/lib/i18n/dictionaries/en.json";
import { routes } from "@/lib/routes";

describe("HomeTemplate", () => {
  it("renders the fixed section order", () => {
    const { container } = render(<HomeTemplate t={en} />);

    const headings = Array.from(
      container.querySelectorAll("h1, section > div > div > h2, section h2"),
    ).map((node) => node.textContent);

    expect(headings[0]).toBe(en.home.hero.headline);
    // Proof must come directly after the hero — the claim, then the evidence.
    expect(headings[1]).toBe(en.home.proof.heading);
    expect(headings[2]).toBe(en.home.twoWays.heading);
    expect(headings[3]).toBe(en.home.services.heading);
    expect(headings[4]).toBe(en.home.method.heading);
    // Featured research is parked until /research has content.
    expect(headings[5]).toBe(en.ctaBlock.heading);
    expect(headings).toHaveLength(6);
  });

  it("points both hero CTAs at real destinations", () => {
    render(<HomeTemplate t={en} />);

    expect(
      screen.getAllByRole("link", { name: en.cta.bookCall })[0],
    ).toHaveAttribute("href", routes.contact);
    expect(
      screen.getByRole("link", { name: en.cta.visibilityCheck }),
    ).toHaveAttribute("href", `${routes.contact}#lead-form`);
  });

  it("gives every proof slot a verifiable destination", () => {
    render(<HomeTemplate t={en} />);

    const proof = screen.getByRole("region", { name: en.home.proof.heading });
    const links = within(proof).getAllByRole("link");

    expect(links).toHaveLength(4);
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "https://crawlmouse.com",
      routes.hafsaSastho,
      routes.research,
      routes.research,
    ]);
    // The external one must not leak the referrer or opener.
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the four services and the four method steps", () => {
    render(<HomeTemplate t={en} />);

    for (const label of Object.values(en.services)) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
    for (const step of Object.values(en.home.method.steps)) {
      expect(
        screen.getByRole("heading", { level: 3, name: step.label }),
      ).toBeInTheDocument();
    }
  });
});
