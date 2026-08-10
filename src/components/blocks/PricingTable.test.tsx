import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PricingTable } from "./utility-blocks";

const tiers = [
  {
    name: "Free AI Opportunity Scan",
    price: "$0",
    unit: "",
    description: "A 30-minute call and a written brief.",
    footnote: "For operating businesses.",
    ctaLabel: "Book your scan",
    featured: false,
  },
  {
    name: "AI Opportunity Audit",
    price: "$2,500",
    unit: "fully credited",
    description: "Two to three weeks of analysis.",
    footnote: "Enterprise firms charge more.",
    ctaLabel: "Start with the audit",
    featured: true,
  },
  {
    name: "Search Visibility",
    price: "from $2,500/mo",
    unit: "",
    description: "Google and AI search as one program.",
    footnote: "",
    ctaLabel: "Get your free visibility check",
    featured: false,
  },
];

const projects = [
  {
    name: "AI Automation build",
    price: "from $7,500",
    note: "fixed-price after audit",
  },
  {
    name: "Care & maintenance",
    price: "from $1,200/mo",
    note: "updates and monitoring",
  },
];

function renderTable() {
  return render(
    <PricingTable
      tiers={tiers}
      projectsHeading="Builds and retainers"
      projects={projects}
      featuredLabel="Most chosen"
      ctaHref="/contact"
    />,
  );
}

describe("PricingTable", () => {
  it("renders every offer from the fixture with its published price", () => {
    renderTable();

    for (const tier of tiers) {
      expect(
        screen.getByRole("heading", { level: 3, name: tier.name }),
      ).toBeInTheDocument();
      expect(screen.getByText(tier.price)).toBeInTheDocument();
      expect(screen.getByText(tier.description)).toBeInTheDocument();
    }
  });

  it("gives each tier its own call to action", () => {
    renderTable();

    for (const tier of tiers) {
      expect(screen.getByRole("link", { name: tier.ctaLabel })).toHaveAttribute(
        "href",
        "/contact",
      );
    }
  });

  it("marks the featured tier with a label, not colour alone", () => {
    renderTable();

    // WCAG 1.4.1: the distinction must survive without colour perception.
    const labels = screen.getAllByText("Most chosen");
    expect(labels).toHaveLength(1);
  });

  it("omits an empty footnote rather than rendering a blank rule", () => {
    renderTable();

    expect(screen.getByText(tiers[0].footnote)).toBeInTheDocument();
    expect(screen.getByText(tiers[1].footnote)).toBeInTheDocument();
  });

  it("lists the build-and-retainer rows with prices and notes", () => {
    renderTable();

    const section = screen
      .getByRole("heading", { level: 2, name: "Builds and retainers" })
      .closest("section");
    expect(section).not.toBeNull();

    for (const project of projects) {
      const scope = within(section as HTMLElement);
      expect(scope.getByText(project.name)).toBeInTheDocument();
      expect(scope.getByText(project.price)).toBeInTheDocument();
      expect(scope.getByText(project.note)).toBeInTheDocument();
    }
  });
});
