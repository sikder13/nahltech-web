"use client";

import { useEffect, useState } from "react";

type Item = { id: string; number: string; title: string };

/**
 * Which section is being read: the last one whose top has passed a line a
 * fifth of the way down the screen.
 */
function useCurrentSection(ids: readonly string[]): string | null {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const line = window.innerHeight * 0.2;
      let found: string | null = null;
      for (const id of ids) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= line) found = id;
      }
      setCurrent(found);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids]);

  return current;
}

/**
 * The section index down the left of a desktop screen. It stays in view, and
 * the section being read is marked in weight and with a rule, never by
 * colour alone.
 */
export function AuditIndex({
  label,
  items,
}: {
  label: string;
  items: readonly Item[];
}) {
  const current = useCurrentSection(items.map((item) => item.id));

  return (
    <nav aria-label={label} className="hidden lg:block">
      <ol className="sticky top-lg space-y-3xs pt-[4.5rem] text-sm">
        {items.map((item) => {
          const active = item.id === current;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? "true" : undefined}
                className={`flex gap-xs border-s-2 py-3xs ps-xs link-accent hover:text-text ${active ? "border-text font-semibold text-text" : "border-transparent text-text-muted"}`}
              >
                <span className="tabular-nums">{item.number}</span>
                {item.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * The three quickest moves, kept in reach on a phone: book, text, and the
 * sheets.
 *
 * It steps aside in two cases. While one of the page's own "book" buttons is
 * on screen, so there are never two primary buttons competing; that covers
 * the hero, which is why the bar first appears once the hero has scrolled
 * away. And while a field has focus, because the on-screen keyboard takes
 * half the screen and a fixed bar would sit on the box being typed in.
 */
export function AuditBar({
  book,
  text,
  sheets,
}: {
  book: { label: string; href: string };
  text: { label: string; href: string };
  sheets: { label: string; href: string };
}) {
  const [primaryInView, setPrimaryInView] = useState(true);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const targets = [...document.querySelectorAll("[data-primary-action]")];
    if (targets.length === 0 || typeof IntersectionObserver === "undefined") {
      setPrimaryInView(false);
      return;
    }
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setPrimaryInView(visible.size > 0);
    });
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const isField = (node: EventTarget | null) =>
      node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement;
    const onFocusIn = (event: FocusEvent) => {
      if (isField(event.target)) setTyping(true);
    };
    const onFocusOut = (event: FocusEvent) => {
      if (isField(event.target)) setTyping(false);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  if (primaryInView || typing) return null;

  const quiet =
    "flex min-h-12 flex-1 items-center justify-center rounded-md border border-text px-xs text-center text-base font-semibold text-text hover:bg-surface";

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex gap-xs border-t border-divider bg-bg p-xs lg:hidden print:hidden">
      <a
        href={book.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-12 flex-1 items-center justify-center rounded-md bg-cta px-xs text-center text-base font-semibold text-on-cta hover:bg-cta-hover"
      >
        {book.label}
      </a>
      <a href={text.href} className={quiet}>
        {text.label}
      </a>
      <a href={sheets.href} className={quiet}>
        {sheets.label}
      </a>
    </div>
  );
}
