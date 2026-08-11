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
  links,
  phoneHref,
  booking,
}: {
  labels: MobileNavLabels;
  links: readonly MobileNavLink[];
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

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
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
        className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-divider bg-bg px-sm py-md"
      >
        <nav aria-label={labels.primaryNavigation}>
          <ul className="flex flex-col gap-2xs">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-2xs text-base text-text link-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
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
