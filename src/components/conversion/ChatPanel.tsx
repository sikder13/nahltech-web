"use client";

import {
  Fragment,
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
import { extractLeadSignal, renderAssistantText } from "@/lib/chat-format";
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
  captureChip: string;
  captureChipDismiss: string;
  rateLimited: string;
  networkError: string;
  callLabel: string;
  bookCall: string;
};

type Turn = { role: "user" | "assistant"; content: string };

/**
 * Visitor messages before the standing offer appears.
 *
 * The backstop for a conversation the assistant never closes: three turns in,
 * someone is engaged enough that a quiet, dismissible way to hand over their
 * details is a service rather than an interruption.
 */
const CHIP_AFTER_VISITOR_MESSAGES = 3;

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/;
/** Seven or more digits, allowing spaces, dots, dashes and parentheses. */
const PHONE_PATTERN = /(?:\d[\s().-]?){7,}/;

/**
 * True when the visitor has put contact details in the conversation, or the
 * assistant has pointed them at the save button.
 *
 * The third of three paths to the form, and the weakest. It was the only one
 * in CC-5, which is how a four-exchange conversation that ended in "want me to
 * have someone look at this?" reached the end without a form: nobody had typed
 * an email address, so nothing fired. The model's own `[[LEAD_FORM]]` token is
 * the first path and the reliable one; the standing chip is the second. This
 * stays because it costs nothing and catches the visitor who pastes their
 * number without being asked.
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
  /**
   * Index of the turn the form hangs under, or null while there is no form.
   *
   * Anchored to a turn rather than pinned to the bottom of the thread, because
   * the form is the answer to one particular message — "yes, have someone call
   * me" — and reading it directly under that message is what makes it obvious
   * what it is for.
   */
  const [consentAnchor, setConsentAnchor] = useState<number | null>(null);
  /**
   * True when the form was asked for — by the assistant, or by the visitor
   * tapping the chip — rather than offered by the contact-details heuristic.
   * Only then does it take focus.
   */
  const [consentFocus, setConsentFocus] = useState(false);
  const [chipDismissed, setChipDismissed] = useState(false);
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

  /**
   * Reveal the form under turn `anchor`, once.
   *
   * All three paths come through here, and the first one to arrive wins: a
   * form that moved down the thread every time something else noticed the
   * visitor wanted contact would lose whatever they had already typed into it.
   */
  function offerCapture(anchor: number, focus: boolean) {
    setConsentFocus((current) => current || focus);
    setConsentAnchor((current) => (current === null ? anchor : current));
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

      // The token is protocol, not conversation. Stripping it here is what
      // keeps it out of all three places it must never reach: the panel, the
      // `chat_messages` row, and the history replayed to the model next turn.
      const { text, requested } = extractLeadSignal(reply);
      setTurns((current) => {
        const next = [...current];
        next[next.length - 1] = { role: "assistant", content: text };
        return next;
      });
      void logMessage(conversationId.current, "assistant", text);

      const finalTurns: Turn[] = [
        ...withUser,
        { role: "assistant", content: text },
      ];
      if (requested || shouldOfferCapture(finalTurns)) {
        offerCapture(withUser.length, requested);
      }
    } catch {
      setNotice(labels.networkError);
    } finally {
      setBusy(false);
    }
  }

  const visitorMessages = turns.filter((turn) => turn.role === "user").length;
  /**
   * The standing offer, shown only when nothing better has happened: no form
   * yet, no lead saved, and not already waved away once. Dismissal is for the
   * life of the conversation — a chip that comes back is a nag.
   */
  const showChip =
    consentAnchor === null &&
    !saved &&
    !chipDismissed &&
    visitorMessages >= CHIP_AFTER_VISITOR_MESSAGES;

  const consentBlock = (
    <div className="space-y-2xs">
      <p className="text-sm font-medium text-text">{labels.consentPrompt}</p>
      <ChatConsentForm
        labels={consentLabels}
        conversationId={conversationId.current}
        autoFocus={consentFocus}
        onSaved={() => setSaved(true)}
      />
    </div>
  );

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
          <Fragment key={index}>
            {/* `whitespace-pre-line` is the other half of the plain-text rule:
                the assistant separates paragraphs with a blank line, and in a
                text node those collapse to a single space without it. */}
            <p className="text-sm whitespace-pre-line text-text">
              <span className="font-semibold">
                {turn.role === "user" ? labels.youLabel : labels.assistantLabel}
                :
              </span>{" "}
              {turn.role === "assistant"
                ? renderAssistantText(turn.content)
                : turn.content}
            </p>
            {consentAnchor === index && !saved ? consentBlock : null}
          </Fragment>
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
        ) : null}
      </div>

      {showChip ? (
        /* Quiet by design: a bordered line above the input, not a banner over
           the conversation. It is the backstop, not the offer. */
        <div className="flex items-center gap-2xs border-t border-divider px-xs pt-2xs">
          <button
            type="button"
            onClick={() => offerCapture(turns.length - 1, true)}
            className="flex-1 rounded-md border border-border px-2xs py-3xs text-start text-sm text-text-muted transition-colors hover:text-text motion-reduce:transition-none"
          >
            {labels.captureChip}
          </button>
          <button
            type="button"
            onClick={() => setChipDismissed(true)}
            aria-label={labels.captureChipDismiss}
            className="rounded-md px-2xs py-3xs text-sm text-text-muted hover:text-text"
          >
            ✕
          </button>
        </div>
      ) : null}

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
