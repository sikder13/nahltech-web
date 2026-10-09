"use client";

import { useEffect, useState } from "react";

/**
 * The two quickest replies, kept in reach on a phone.
 *
 * It steps aside in two cases. When the reply section is on screen, because
 * the same two actions are already there. And whenever a field has focus,
 * because the on-screen keyboard takes half the screen and a fixed bar on
 * top of it would sit over the very box the reader is typing in.
 */
export function LetterActionBar({
  contactId,
  book,
  text,
}: {
  contactId: string;
  book: { label: string; href: string };
  text: { label: string; href: string };
}) {
  const [contactInView, setContactInView] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const target = document.getElementById(contactId);
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) =>
      setContactInView(entry.isIntersecting),
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [contactId]);

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

  if (contactInView || typing) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex gap-xs border-t border-divider bg-bg p-xs lg:hidden print:hidden">
      <a
        href={book.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-12 flex-1 items-center justify-center rounded-md bg-cta px-xs text-center text-sm font-semibold text-on-cta hover:bg-cta-hover"
      >
        {book.label}
      </a>
      <a
        href={text.href}
        className="flex min-h-12 flex-1 items-center justify-center rounded-md border border-text px-xs text-center text-sm font-semibold text-text hover:bg-surface"
      >
        {text.label}
      </a>
    </div>
  );
}
