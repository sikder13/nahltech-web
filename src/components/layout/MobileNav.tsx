"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { contactDetails, routes } from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

const FOCUSABLE = "a[href], button:not([disabled])";

/**
 * Mobile navigation panel.
 *
 * While open it traps Tab within the panel, restores focus to the trigger on
 * close, closes on Escape, and closes on navigation. Rendered below the `md`
 * breakpoint only.
 */
export function MobileNav({ t }: { t: Dictionary }) {
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

  const links = [
    { href: routes.services, label: t.nav.services },
    { href: routes.aiSearchVisibility, label: t.services.aiSearchVisibility },
    { href: routes.localSeo, label: t.services.localSeo },
    { href: routes.webDevelopment, label: t.services.webDevelopment },
    { href: routes.aiAutomation, label: t.services.aiAutomation },
    { href: routes.products, label: t.nav.products },
    { href: routes.crawlmouse, label: t.products.crawlmouse },
    { href: routes.hafsaSastho, label: t.products.hafsaSastho },
    { href: routes.pricing, label: t.nav.pricing },
    { href: routes.research, label: t.nav.research },
    { href: routes.about, label: t.nav.about },
  ];

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t.a11y.closeMenu : t.a11y.openMenu}
        onClick={() => setOpen((value) => !value)}
        className="p-2xs text-text hover:text-accent"
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
        <nav aria-label={t.a11y.primaryNavigation}>
          <ul className="flex flex-col gap-2xs">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-2xs text-base text-text hover:text-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-md flex flex-col gap-2xs border-t border-divider pt-md">
          <a
            href={contactDetails.phoneHref}
            className="py-2xs text-base text-text-muted hover:text-accent"
          >
            {t.cta.phoneDisplay}
          </a>
          <ButtonLink href={routes.contact}>{t.cta.bookCall}</ButtonLink>
        </div>
      </div>
    </div>
  );
}
