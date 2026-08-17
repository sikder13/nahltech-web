import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MobileNav } from "./MobileNav";

import en from "@/lib/i18n/dictionaries/en.json";
import { bookingCta, routes } from "@/lib/routes";

const labels = {
  openMenu: en.a11y.openMenu,
  closeMenu: en.a11y.closeMenu,
  primaryNavigation: en.a11y.primaryNavigation,
  phoneDisplay: en.cta.phoneDisplay,
  bookCall: en.cta.bookCall,
};

const items = [
  {
    href: routes.services,
    label: en.nav.services,
    children: [
      { href: routes.aiConsultancy, label: en.services.aiConsultancy },
    ],
  },
  { href: routes.about, label: en.nav.about },
];

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// The trigger's accessible name flips between "Open menu" and "Close menu",
// so find it by the attribute that does not change.
function getTrigger() {
  const trigger = document.querySelector<HTMLButtonElement>(
    "button[aria-controls]",
  );
  if (!trigger) throw new Error("menu trigger not found");
  return trigger;
}

function getPanel() {
  return document.getElementById(getTrigger().getAttribute("aria-controls")!);
}

describe("MobileNav", () => {
  it("is closed on first render", () => {
    render(
      <MobileNav
        labels={labels}
        items={items}
        phoneHref="tel:+13175074303"
        booking={bookingCta}
      />,
    );

    const trigger = screen.getByRole("button", { name: en.a11y.openMenu });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(getPanel()).toHaveAttribute("hidden");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <MobileNav
        labels={labels}
        items={items}
        phoneHref="tel:+13175074303"
        booking={bookingCta}
      />,
    );

    const trigger = screen.getByRole("button", { name: en.a11y.openMenu });
    await user.click(trigger);

    const opened = screen.getByRole("button", { name: en.a11y.closeMenu });
    expect(opened).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(
      screen.getByRole("button", { name: en.a11y.openMenu }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: en.a11y.openMenu }),
    );
  });

  it("traps focus inside the panel while open", async () => {
    const user = userEvent.setup();
    render(
      <MobileNav
        labels={labels}
        items={items}
        phoneHref="tel:+13175074303"
        booking={bookingCta}
      />,
    );

    await user.click(screen.getByRole("button", { name: en.a11y.openMenu }));

    const panel = getPanel();
    expect(panel).not.toHaveAttribute("hidden");

    const focusables = Array.from(
      panel!.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
    );
    expect(focusables.length).toBeGreaterThan(1);

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    // Opening moves focus into the panel.
    expect(document.activeElement).toBe(first);

    // Shift+Tab from the first element wraps to the last.
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);

    // Tab from the last element wraps back to the first.
    await user.tab();
    expect(document.activeElement).toBe(first);

    // Focus never escapes to the document body.
    expect(panel!.contains(document.activeElement)).toBe(true);
  });
});

describe("MobileNav visual hierarchy", () => {
  async function openMenu() {
    const user = userEvent.setup();
    render(
      <MobileNav
        labels={labels}
        items={items}
        phoneHref="tel:+13175074303"
        booking={bookingCta}
      />,
    );
    await user.click(screen.getByRole("button", { name: en.a11y.openMenu }));
    return getPanel()!;
  }

  it("keeps every destination one tap away", async () => {
    // The grouping is visual. If a parent ever becomes a disclosure button,
    // reaching a service costs two taps and this fails.
    const panel = await openMenu();

    const parent = within(panel).getByRole("link", { name: en.nav.services });
    expect(parent).toHaveAttribute("href", routes.services);
    expect(
      within(panel).getByRole("link", { name: en.services.aiConsultancy }),
    ).toHaveAttribute("href", routes.aiConsultancy);
    // No accordion: the only button in the panel is the trigger itself.
    expect(within(panel).queryAllByRole("button")).toHaveLength(0);
  });

  it("nests children in their own list under the parent", async () => {
    const panel = await openMenu();

    const parentItem = within(panel)
      .getByRole("link", { name: en.nav.services })
      .closest("li")!;
    const childList = parentItem.querySelector("ul");

    expect(childList).not.toBeNull();
    expect(
      within(childList as HTMLElement).getByRole("link", {
        name: en.services.aiConsultancy,
      }),
    ).toBeInTheDocument();
    // The hairline that does the grouping.
    expect(childList!.className).toContain("border-s");
  });

  it("weights a parent above its children", async () => {
    const panel = await openMenu();

    const parent = within(panel).getByRole("link", { name: en.nav.services });
    const child = within(panel).getByRole("link", {
      name: en.services.aiConsultancy,
    });

    expect(parent.className).toContain("font-semibold");
    expect(parent.className).toContain("text-base");
    expect(child.className).toContain("text-sm");
    expect(child.className).toContain("text-text-muted");
  });

  it("marks a hub row with a decorative chevron, and a leaf without one", async () => {
    const panel = await openMenu();

    const parent = within(panel).getByRole("link", { name: en.nav.services });
    const leaf = within(panel).getByRole("link", { name: en.nav.about });

    const chevron = parent.querySelector("svg");
    expect(chevron).not.toBeNull();
    expect(chevron).toHaveAttribute("aria-hidden", "true");
    expect(leaf.querySelector("svg")).toBeNull();
  });

  it("rules off where the grouped rows end", async () => {
    // Derived from the data, so a sixth destination cannot land on the wrong
    // side of the divider.
    const panel = await openMenu();

    const leafItem = within(panel)
      .getByRole("link", { name: en.nav.about })
      .closest("li")!;
    expect(leafItem.className).toContain("border-t");
  });

  it("holds tap targets at 44px and gives parents more room", async () => {
    const panel = await openMenu();

    const parent = within(panel).getByRole("link", { name: en.nav.services });
    const child = within(panel).getByRole("link", {
      name: en.services.aiConsultancy,
    });

    // jsdom has no layout, so the minimums are asserted as the classes that
    // set them: 48px parents, 44px children.
    expect(parent.className).toContain("min-h-12");
    expect(child.className).toContain("min-h-11");
  });

  it("pads the scroll container clear of the chat launcher", async () => {
    // Thumb room at the end of a long scroll. Not sufficient on its own —
    // see the next test.
    const panel = await openMenu();
    expect(panel.className).toContain("pb-3xl");
  });

  it("stands the chat launcher down while the menu is open", async () => {
    // Padding alone did not solve this. The launcher is fixed at z-50 on the
    // body and the last row lands under it by content flow, not by scroll
    // position, so on a 390x844 screen "Book a call" sat beneath it with the
    // padding already in place. The panel cannot out-rank the launcher from
    // inside the header's stacking context, so the launcher stands down.
    const user = userEvent.setup();
    render(
      <MobileNav
        labels={labels}
        items={items}
        phoneHref="tel:+13175074303"
        booking={bookingCta}
      />,
    );

    expect(document.body.dataset.navOpen).toBeUndefined();

    await user.click(screen.getByRole("button", { name: en.a11y.openMenu }));
    expect(document.body.dataset.navOpen).toBe("true");

    await user.keyboard("{Escape}");
    expect(document.body.dataset.navOpen).toBeUndefined();
  });
});
