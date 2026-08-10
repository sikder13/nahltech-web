import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AboutTemplate,
  ContactTemplate,
  PricingTemplate,
} from "./UtilityTemplates";

import en from "@/lib/i18n/dictionaries/en.json";
import { contactDetails } from "@/lib/routes";

describe("AboutTemplate", () => {
  it("renders the story, both founders and the credentials row", () => {
    render(<AboutTemplate t={en} />);

    expect(
      screen.getByRole("heading", { level: 1, name: en.pages.about.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("Udaay Sikder")).toBeInTheDocument();
    expect(screen.getByText("Founder & CEO")).toBeInTheDocument();
    expect(screen.getByText("Mohieminul Islam Khan")).toBeInTheDocument();
    expect(screen.getByText("Co-Founder & Director")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: en.about.credentialsHeading }),
    ).toBeInTheDocument();
  });

  it("uses no images for team members", () => {
    const { container } = render(<AboutTemplate t={en} />);
    // Neutral glyphs only — no stock photography, and nothing with a src.
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });
});

describe("ContactTemplate", () => {
  it("exposes the NAP with working protocol links", () => {
    render(<ContactTemplate t={en} />);

    expect(
      screen.getByRole("link", { name: en.cta.phoneDisplay }),
    ).toHaveAttribute("href", contactDetails.phoneHref);
    expect(
      screen.getByRole("link", { name: contactDetails.email }),
    ).toHaveAttribute("href", contactDetails.emailHref);
    expect(screen.getByText(/6902 Challenge Ln/)).toBeInTheDocument();
  });

  it("anchors the form section so the home hero CTA resolves", () => {
    const { container } = render(<ContactTemplate t={en} />);

    // The home page links to /contact#lead-form; that target must exist.
    expect(container.querySelector("#lead-form")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: en.leadForm.submit }),
    ).toBeInTheDocument();
  });
});

describe("PricingTemplate", () => {
  it("renders three tiers with placeholder prices only", () => {
    render(<PricingTemplate t={en} />);

    for (const tier of en.pricing.tiers) {
      expect(
        screen.getByRole("heading", { level: 3, name: tier.name }),
      ).toBeInTheDocument();
    }
    // Every price on the page is still a gated placeholder.
    const prices = screen.getAllByText("[PRICE]");
    expect(prices).toHaveLength(
      en.pricing.tiers.length + en.pricing.projects.length,
    );
  });
});
