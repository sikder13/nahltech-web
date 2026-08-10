import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PricingTable } from "./utility-blocks";

const tiers = [
  {
    name: "Tier one",
    price: "[PRICE]",
    unit: "per month",
    description: "[PLACEHOLDER: description one]",
    features: ["[PLACEHOLDER: feature a]", "[PLACEHOLDER: feature b]"],
  },
  {
    name: "Tier two",
    price: "[PRICE]",
    unit: "per month",
    description: "[PLACEHOLDER: description two]",
    features: ["[PLACEHOLDER: feature c]"],
  },
  {
    name: "Tier three",
    price: "[PRICE]",
    unit: "per month",
    description: "[PLACEHOLDER: description three]",
    features: ["[PLACEHOLDER: feature d]"],
  },
];

const projects = [
  { name: "[PLACEHOLDER: project one]", price: "[PRICE]" },
  { name: "[PLACEHOLDER: project two]", price: "[PRICE]" },
];

function renderTable() {
  return render(
    <PricingTable
      tiersHeading="Retainers"
      tiers={tiers}
      projectsHeading="Project work"
      projects={projects}
      ctaLabel="Book a call"
      ctaHref="/contact"
    />,
  );
}

describe("PricingTable", () => {
  it("renders every offer from the fixture", () => {
    renderTable();

    for (const tier of tiers) {
      const heading = screen.getByRole("heading", {
        level: 3,
        name: tier.name,
      });
      expect(heading).toBeInTheDocument();
      expect(screen.getByText(tier.description)).toBeInTheDocument();
      for (const feature of tier.features) {
        expect(screen.getByText(feature)).toBeInTheDocument();
      }
    }

    // One [PRICE] per tier plus one per project row.
    expect(screen.getAllByText("[PRICE]")).toHaveLength(
      tiers.length + projects.length,
    );
  });

  it("renders the project services list beneath the tiers", () => {
    renderTable();

    const projectsSection = screen
      .getByRole("heading", { level: 2, name: "Project work" })
      .closest("section");
    expect(projectsSection).not.toBeNull();

    for (const project of projects) {
      expect(
        within(projectsSection as HTMLElement).getByText(project.name),
      ).toBeInTheDocument();
    }
  });

  it("gives every tier a CTA pointing at the same destination", () => {
    renderTable();

    const ctas = screen.getAllByRole("link", { name: "Book a call" });
    expect(ctas).toHaveLength(tiers.length);
    for (const cta of ctas) {
      expect(cta).toHaveAttribute("href", "/contact");
    }
  });
});
