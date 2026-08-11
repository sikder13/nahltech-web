"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";

import type { ChatConsentLabels } from "@/components/conversion/ChatConsentForm";
import type { ChatPanelLabels } from "@/components/conversion/ChatPanel";

/**
 * The panel and everything it pulls in — the Supabase browser client, the
 * consent form, the streaming reader — load on first open, not on page load.
 * Marketing pages carry only the launcher until someone actually wants to
 * talk (ARCH-1 §7, JS budget).
 */
const ChatPanel = dynamic(
  () => import("@/components/conversion/ChatPanel").then((m) => m.ChatPanel),
  { ssr: false },
);

export function ChatWidget({
  labels,
  consentLabels,
}: {
  labels: ChatPanelLabels & { launcherLabel: string };
  consentLabels: ChatConsentLabels;
}) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);

  function toggle() {
    setEverOpened(true);
    setOpen((current) => !current);
  }

  function close() {
    setOpen(false);
    // Focus goes back where it came from, so a keyboard visitor is not
    // dropped at the top of the document.
    launcherRef.current?.focus();
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={labels.launcherLabel}
        /* Bottom-end, clear of the page's own CTAs at 390px. Gold appears as
           a ring only — it is decoration in this design system, never a fill
           or a text colour. */
        className="fixed end-sm bottom-sm z-50 flex h-14 w-14 items-center justify-center rounded-full bg-cta text-on-cta ring-2 ring-accent transition-transform hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>

      {everOpened ? (
        <ChatPanel
          open={open}
          onClose={close}
          labels={labels}
          consentLabels={consentLabels}
        />
      ) : null}
    </>
  );
}
