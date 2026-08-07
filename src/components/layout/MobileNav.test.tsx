import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MobileNav } from "./MobileNav";

import en from "@/lib/i18n/dictionaries/en.json";

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
    render(<MobileNav t={en} />);

    const trigger = screen.getByRole("button", { name: en.a11y.openMenu });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(getPanel()).toHaveAttribute("hidden");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<MobileNav t={en} />);

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
    render(<MobileNav t={en} />);

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
