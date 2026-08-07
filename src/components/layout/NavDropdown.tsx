"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export type NavItem = { href: string; label: string };

/**
 * Disclosure-style nav dropdown.
 *
 * Opens on click or keyboard activation rather than hover alone, so it is
 * reachable without a pointer. Escape closes it and returns focus to the
 * trigger; a pointer press outside closes it without stealing focus.
 */
export function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: readonly NavItem[];
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3xs py-2xs text-sm font-medium text-text hover:text-accent"
      >
        {label}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-3 fill-current"
        >
          <path d="M5 7l5 6 5-6z" />
        </svg>
      </button>

      <ul
        id={menuId}
        hidden={!open}
        className="absolute start-0 top-full z-50 min-w-56 rounded-md border border-divider bg-surface py-2xs shadow-lg"
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-sm py-2xs text-sm text-text-muted hover:bg-bg hover:text-accent"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
