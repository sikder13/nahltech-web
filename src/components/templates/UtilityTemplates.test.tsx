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
  it("publishes the founding-client terms without a live counter", () => {
    render(<PricingTemplate t={en} />);

    expect(
      screen.getByRole("heading", { name: en.pricing.founding.heading }),
    ).toBeInTheDocument();
    // The count is a static dictionary value, edited by hand.
    expect(en.pricing.founding.heading).toContain(
      `${en.pricing.founding.spotsOpen} of 10`,
    );
  });

  it("renders all three tiers and the build list with real prices", () => {
    render(<PricingTemplate t={en} />);

    for (const tier of en.pricing.tiers) {
      expect(
        screen.getByRole("heading", { level: 3, name: tier.name }),
      ).toBeInTheDocument();
      expect(screen.getByText(tier.price)).toBeInTheDocument();
    }
    for (const project of en.pricing.projects) {
      expect(screen.getByText(project.name)).toBeInTheDocument();
    }
    // No gated token may survive on a page that now publishes numbers.
    expect(screen.queryByText("[PRICE]")).not.toBeInTheDocument();
  });

  it("lists every discount band", () => {
    render(<PricingTemplate t={en} />);

    for (const item of en.pricing.discounts.items) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    expect(
      screen.getByText(en.pricing.discounts.community),
    ).toBeInTheDocument();
  });
});
