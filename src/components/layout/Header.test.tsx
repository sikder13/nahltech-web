import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Header } from "./Header";

import en from "@/lib/i18n/dictionaries/en.json";
import { contactDetails, routes } from "@/lib/routes";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Header", () => {
  it("renders every nav item defined in the en dictionary", () => {
    render(<Header t={en} />);

    const nav = screen.getByTestId("primary-nav");

    // Top-level items, including the two dropdown triggers.
    for (const label of [
      en.nav.services,
      en.nav.products,
      en.nav.pricing,
      en.nav.research,
      en.nav.about,
    ]) {
      expect(
        within(nav).getAllByText(label).length,
        `missing top-level nav item "${label}"`,
      ).toBeGreaterThan(0);
    }

    // Every service and product in the dropdowns.
    for (const label of [
      en.services.aiSearchVisibility,
      en.services.localSeo,
      en.services.webDevelopment,
      en.services.aiAutomation,
      en.products.crawlmouse,
      en.products.hafsaSastho,
    ]) {
      expect(
        within(nav).getAllByText(label).length,
        `missing dropdown item "${label}"`,
      ).toBeGreaterThan(0);
    }
  });

  it("exposes the phone number as a click-to-call link", () => {
    render(<Header t={en} />);

    const [phone] = screen.getAllByRole("link", {
      name: en.cta.phoneDisplay,
    });
    expect(phone).toHaveAttribute("href", contactDetails.phoneHref);
    expect(contactDetails.phoneHref).toBe("tel:+13175074303");
  });

  it("renders the Book a call CTA pointing at a real route", () => {
    render(<Header t={en} />);

    const [cta] = screen.getAllByRole("link", { name: en.cta.bookCall });
    expect(cta).toHaveAttribute("href", routes.contact);
  });

  it("marks dropdown triggers as collapsed until opened", () => {
    render(<Header t={en} />);

    const trigger = screen.getByRole("button", { name: en.nav.services });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "true");
  });
});
