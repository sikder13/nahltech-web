import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Header } from "./Header";

import en from "@/lib/i18n/dictionaries/en.json";
import { bookingCta, contactDetails, routes } from "@/lib/routes";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Header", () => {
  it("renders the five top-level nav items, in order", () => {
    // Asserted as an exact ordered list rather than "every key in en.nav",
    // which is what this used to do. The dictionary carries labels for pages
    // that are deliberately not in the bar — Research and Blog — so iterating
    // it could only ever describe the dictionary, not the decision.
    render(<Header t={en} />);

    const nav = screen.getByTestId("primary-nav");
    // The first control in each item, not the item's text: a dropdown's
    // textContent swallows every option inside it.
    const items = within(nav)
      .getAllByRole("listitem")
      .map((li) => li.querySelector("button, a")?.textContent?.trim());

    expect(items).toEqual([
      en.nav.services,
      en.nav.products,
      en.nav.pricing,
      en.nav.about,
      en.nav.contact,
    ]);
  });

  it("keeps Research out of the bar while leaving the route reachable", () => {
    // Removed when Contact went in: the bar was crowding at laptop widths and
    // Research is reached from the footer, the home page, every service page
    // and the blog, whereas Contact had no such path. Presentation only — the
    // sitemap and every research URL are untouched, which sitemap.test.ts
    // holds.
    render(<Header t={en} />);

    const nav = screen.getByTestId("primary-nav");
    expect(within(nav).queryByText(en.nav.research)).not.toBeInTheDocument();
    expect(routes.research).toBe("/research");
  });

  it("sends Contact to the contact page", () => {
    render(<Header t={en} />);

    const nav = screen.getByTestId("primary-nav");
    expect(
      within(nav).getByRole("link", { name: en.nav.contact }),
    ).toHaveAttribute("href", routes.contact);
  });

  it("lists every service and product in the dropdowns", () => {
    render(<Header t={en} />);

    const nav = screen.getByTestId("primary-nav");
    for (const label of [
      ...Object.values(en.services),
      en.products.crawlmouse,
      en.products.hafsaSastho,
    ]) {
      expect(
        within(nav).getAllByText(label).length,
        `missing dropdown item "${label}"`,
      ).toBeGreaterThan(0);
    }
  });

  it("gives the mobile menu the same five destinations, in the same order", () => {
    // The two menus are built from separate literals in this file, so they
    // can silently disagree. A visitor on a phone reaching a different set of
    // pages than one on a laptop is the bug this catches.
    render(<Header t={en} />);

    const panel = document.querySelector("#mobile-menu, [id^='mobile']");
    const scope = panel ?? document.body;
    const hrefs = [...scope.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );

    expect(hrefs).toContain(routes.contact);
    // Research is reachable everywhere else; it is simply not in either menu.
    expect(hrefs.filter((href) => href === routes.research)).toHaveLength(0);

    // Order of the five top-level destinations, ignoring dropdown children.
    const topLevel: string[] = [
      routes.services,
      routes.products,
      routes.pricing,
      routes.about,
      routes.contact,
    ];
    const seen = hrefs.filter((href) => topLevel.includes(href ?? ""));
    expect(seen.filter((href, i) => seen.indexOf(href) === i)).toEqual(
      topLevel,
    );
  });

  it("exposes the phone number as a click-to-call link", () => {
    render(<Header t={en} />);

    const [phone] = screen.getAllByRole("link", {
      name: en.cta.phoneDisplay,
    });
    expect(phone).toHaveAttribute("href", contactDetails.phoneHref);
    expect(contactDetails.phoneHref).toBe("tel:+13175074303");
  });

  it("sends the Book a call CTA to booking, hardened as an external link", () => {
    render(<Header t={en} />);

    const [cta] = screen.getAllByRole("link", { name: en.cta.bookCall });
    expect(cta).toHaveAttribute("href", bookingCta.href);
    // Off-site, so it opens in a new tab with the opener detached — the same
    // treatment the Crawlmouse links get.
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("marks dropdown triggers as collapsed until opened", () => {
    render(<Header t={en} />);

    const trigger = screen.getByRole("button", { name: en.nav.services });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "true");
  });
});
