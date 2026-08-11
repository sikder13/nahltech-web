"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import {
  ChatConsentForm,
  type ChatConsentLabels,
} from "@/components/conversion/ChatConsentForm";
import { inputClasses } from "@/components/ui/Field";
import { createConversation, logMessage } from "@/lib/chat-log";
import { bookingUrl, contactDetails } from "@/lib/routes";

export type ChatPanelLabels = {
  title: string;
  closeLabel: string;
  placeholder: string;
  send: string;
  conversationLabel: string;
  youLabel: string;
  assistantLabel: string;
  fallback: string;
  consentPrompt: string;
  consentButton: string;
  consentSuccess: string;
  rateLimited: string;
  networkError: string;
  callLabel: string;
  bookCall: string;
};

type Turn = { role: "user" | "assistant"; content: string };

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/;
/** Seven or more digits, allowing spaces, dots, dashes and parentheses. */
const PHONE_PATTERN = /(?:\d[\s().-]?){7,}/;

/**
 * True when the visitor has put contact details in the conversation, or the
 * assistant has pointed them at the save button.
 *
 * Detection only decides whether to *offer* the form. It never fills it in
 * and never submits: consent is the visitor typing their details into the
 * form and pressing the button (ARCH-1 §4.2).
 */
function shouldOfferCapture(turns: Turn[]): boolean {
  return turns.some((turn) =>
    turn.role === "user"
      ? EMAIL_PATTERN.test(turn.content) || PHONE_PATTERN.test(turn.content)
      : turn.content.toLowerCase().includes("save my details"),
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ChatPanel({
  open,
  onClose,
  labels,
  consentLabels,
}: {
  open: boolean;
  onClose: () => void;
  labels: ChatPanelLabels;
  consentLabels: ChatConsentLabels;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [saved, setSaved] = useState(false);

  const conversationId = useRef<string | null>(null);
  const started = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // One conversation row per panel, created the first time it opens rather
  // than on page load — an unopened widget writes nothing.
  useEffect(() => {
    if (!open || started.current) return;
    started.current = true;
    void createConversation().then((id) => {
      conversationId.current = id;
    });
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    // Focus trap: while the panel is open, Tab cycles inside it rather than
    // walking the page behind it.
    const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes || nodes.length === 0) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;

    setDraft("");
    setNotice(null);
    setBusy(true);

    const history = turns.slice(-20);
    const withUser: Turn[] = [...turns, { role: "user", content: message }];
    setTurns(withUser);
    void logMessage(conversationId.current, "user", message);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, history }),
      });

      if (response.status === 429) {
        setNotice(labels.rateLimited);
        return;
      }
      if (!response.ok || !response.body) {
        setNotice(labels.networkError);
        return;
      }

      // Open an empty assistant turn and fill it as chunks land.
      setTurns((current) => [...current, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setTurns((current) => {
          const next = [...current];
          next[next.length - 1] = { role: "assistant", content: reply };
          return next;
        });
      }

      void logMessage(conversationId.current, "assistant", reply);
      setTurns((current) => {
        if (shouldOfferCapture(current)) setShowConsent(true);
        return current;
      });
    } catch {
      setNotice(labels.networkError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={labels.title}
      hidden={!open}
      onKeyDown={handleKeyDown}
      className="fixed end-sm bottom-[5.5rem] z-50 flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-lg border border-border bg-surface shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-divider px-xs py-2xs">
        <h2 className="text-sm font-semibold text-text">{labels.title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.closeLabel}
          className="rounded-md px-2xs py-3xs text-sm text-text-muted hover:text-text"
        >
          ✕
        </button>
      </div>

      <div
        aria-live="polite"
        aria-label={labels.conversationLabel}
        className="flex-1 space-y-xs overflow-y-auto px-xs py-xs"
      >
        {turns.map((turn, index) => (
          <p key={index} className="text-sm text-text">
            <span className="font-semibold">
              {turn.role === "user" ? labels.youLabel : labels.assistantLabel}:
            </span>{" "}
            {turn.content}
          </p>
        ))}

        {notice ? (
          <p role="alert" className="text-sm font-medium text-text">
            {notice}{" "}
            <a href={contactDetails.phoneHref} className="link-accent">
              {labels.callLabel}
            </a>
          </p>
        ) : null}

        {saved ? (
          /* Confirmation lives in the thread, not inside the form — the form
             unmounts once it has done its job. */
          <p
            role="status"
            className="rounded-md border border-border bg-bg p-xs text-sm font-medium text-text"
          >
            {labels.consentSuccess}{" "}
            {bookingUrl ? (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-accent"
              >
                {labels.bookCall}
              </a>
            ) : (
              <a href={contactDetails.phoneHref} className="link-accent">
                {labels.callLabel}
              </a>
            )}
          </p>
        ) : showConsent ? (
          <div className="space-y-2xs">
            <p className="text-sm font-medium text-text">
              {labels.consentPrompt}
            </p>
            <ChatConsentForm
              labels={consentLabels}
              conversationId={conversationId.current}
              onSaved={() => setSaved(true)}
            />
          </div>
        ) : null}
      </div>

      <form
        onSubmit={send}
        className="flex gap-2xs border-t border-divider px-xs py-2xs"
      >
        <label htmlFor="chat-message" className="sr-only">
          {labels.placeholder}
        </label>
        <input
          id="chat-message"
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={1000}
          placeholder={labels.placeholder}
          className={inputClasses(false)}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-md bg-cta px-sm py-2xs text-sm font-semibold text-on-cta transition-colors hover:bg-cta-hover disabled:opacity-60 motion-reduce:transition-none"
        >
          {labels.send}
        </button>
      </form>
    </div>
  );
}
