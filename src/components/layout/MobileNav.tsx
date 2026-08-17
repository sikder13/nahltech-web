"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ButtonLink } from "@/components/ui/ButtonLink";

const FOCUSABLE = "a[href], button:not([disabled])";

export type MobileNavLabels = {
  openMenu: string;
  closeMenu: string;
  primaryNavigation: string;
  phoneDisplay: string;
  bookCall: string;
};

export type MobileNavLink = { href: string; label: string };

/**
 * A top-level destination, optionally with the pages it stands over.
 *
 * A parent is a real link to its own hub, never a disclosure control: the menu
 * has twelve destinations and every one of them stays one tap away. The
 * grouping is visual only — it gives the list a shape the eye can skim
 * instead of twelve rows at identical weight.
 */
export type MobileNavItem = MobileNavLink & {
  children?: readonly MobileNavLink[];
};

/**
 * Marks a row as a hub page rather than a leaf. Decorative — the parent's
 * label already says where it goes — so it is hidden from assistive tech, and
 * it flips for RTL along with everything else on the ar locale.
 */
function HubChevron() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      className="size-4 shrink-0 text-text-muted rtl:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  );
}

/**
 * Mobile navigation panel.
 *
 * While open it traps Tab within the panel, restores focus to the trigger on
 * close, closes on Escape, and closes on navigation. Rendered below the `md`
 * breakpoint only.
 *
 * Takes only the strings and links it renders, never the whole dictionary.
 * Props of a client component are serialised into every page's flight
 * payload, so handing this the full `t` object shipped the entire dictionary
 * — including copy for pages the visitor is not on — inside the HTML.
 */
export function MobileNav({
  labels,
  items,
  phoneHref,
  booking,
}: {
  labels: MobileNavLabels;
  items: readonly MobileNavItem[];
  phoneHref: string;
  booking: { href: string; external: boolean };
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Any navigation dismisses the panel.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));

    focusables()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = focusables();
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /**
     * Tells the rest of the page a full-screen nav is up.
     *
     * The chat launcher is `fixed` at z-50 on the body, and this panel lives
     * inside the header's own stacking context, so no z-index available here
     * can put the panel above it — the launcher paints over the menu whatever
     * we do locally. It is also simply wrong for a floating button to sit on
     * top of a full-screen navigation.
     *
     * An attribute rather than shared state: the two components have no
     * common owner short of the layout, and a body attribute is the smallest
     * contract that does not make ChatWidget import from the header. The rule
     * that reads it is in globals.css, next to the other body-level styles.
     */
    document.body.dataset.navOpen = "true";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      delete document.body.dataset.navOpen;
    };
  }, [open, close]);

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? labels.closeMenu : labels.openMenu}
        onClick={() => setOpen((value) => !value)}
        className="p-2xs text-text hover:text-cta-hover"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6">
          {open ? (
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          ) : (
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          )}
        </svg>
      </button>

      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        /* `pb-3xl` is launcher clearance, not rhythm. The chat launcher is
           fixed at `bottom-sm` and is `h-14`, so it covers the bottom 72px of
           the viewport at z-50 — above this panel. On a short screen the list
           scrolls, and without this the last row sits underneath it. 96px
           clears the button and leaves a thumb's room besides. */
        className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-divider bg-bg px-sm pt-md pb-3xl"
      >
        <nav aria-label={labels.primaryNavigation}>
          <ul className="flex flex-col">
            {items.map((item, index) => {
              const children = item.children ?? [];
              const isGroup = children.length > 0;
              // The rule sits where the grouped rows end and the plain ones
              // begin, derived from the data rather than hardcoded at index 2
              // — a sixth destination must not silently land on the wrong side.
              const opensFlatRun =
                !isGroup &&
                index > 0 &&
                Boolean(items[index - 1].children?.length);

              return (
                <li
                  key={item.href}
                  className={
                    opensFlatRun
                      ? "mt-2xs border-t border-divider pt-2xs"
                      : undefined
                  }
                >
                  <Link
                    href={item.href}
                    className="flex min-h-12 items-center justify-between gap-sm py-2xs text-base font-semibold text-text link-accent"
                  >
                    {item.label}
                    {isGroup ? <HubChevron /> : null}
                  </Link>

                  {isGroup ? (
                    /* The hairline is the grouping: it ties the children to
                       the parent without indenting them so far that the tap
                       targets narrow. Logical properties, so it moves to the
                       right edge on ar. */
                    <ul className="ms-3xs mb-2xs border-s border-divider ps-sm">
                      {children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="flex min-h-11 items-center py-3xs text-sm text-text-muted link-accent hover:text-text"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-md flex flex-col gap-2xs border-t border-divider pt-md">
          <a
            href={phoneHref}
            className="py-2xs text-base text-text-muted link-accent hover:text-text"
          >
            {labels.phoneDisplay}
          </a>
          <ButtonLink href={booking.href} external={booking.external}>
            {labels.bookCall}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
