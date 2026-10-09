"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { Honeypot } from "@/components/conversion/Honeypot";

type Status = "idle" | "sending" | "sent" | "failed";

/**
 * The one-line reply box at the foot of a letter page.
 *
 * One field, because the page promises a ten-second reply. The placeholder
 * is the only instruction, so it doubles as the field's accessible name.
 * Nothing is sent until the reader presses Send, and nothing is sent that
 * they did not type: the page token says which page this is, and the server
 * reads the rest from that page's own config.
 *
 * On success the form is replaced by one line and focus moves to it, so a
 * keyboard or screen-reader user is told what happened instead of being left
 * on a control that no longer exists.
 */
export function ReplyForm({
  token,
  labels,
  maxLength,
  quiet = false,
}: {
  token: string;
  /**
   * Draws Send as an outlined button, for a page that keeps the solid
   * style for its one primary action.
   */
  quiet?: boolean;
  /** The longest reply the endpoint accepts. */
  maxLength: number;
  labels: {
    placeholder: string;
    send: string;
    success: string;
    failure: string;
  };
}) {
  const [status, setStatus] = useState<Status>("idle");
  const doneRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (status === "sent") doneRef.current?.focus();
  }, [status]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = new FormData(event.currentTarget);
    const text = String(form.get("reply") ?? "").trim();
    if (!text) return;

    setStatus("sending");
    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          text,
          website_url: String(form.get("website_url") ?? ""),
        }),
      });
      setStatus(response.ok ? "sent" : "failed");
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <p ref={doneRef} tabIndex={-1} role="status" className="mt-lg text-text">
        {labels.success}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative mt-lg">
      <Honeypot />
      {/* A two-line box rather than a one-line input: the placeholder is the
          only instruction, and on a phone it has to wrap to be read whole. */}
      <textarea
        name="reply"
        required
        rows={2}
        maxLength={maxLength}
        autoComplete="off"
        aria-label={labels.placeholder}
        placeholder={labels.placeholder}
        onKeyDown={(event) => {
          // Enter sends, as it would from a one-line field.
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        className="block w-full resize-none rounded-md border border-border bg-bg px-sm py-xs text-lg text-text placeholder:text-text-muted"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className={`mt-xs min-h-12 w-full rounded-md px-lg text-lg font-semibold disabled:opacity-60 sm:w-auto ${quiet ? "border border-text text-text hover:bg-surface" : "bg-cta text-on-cta hover:bg-cta-hover"}`}
      >
        {labels.send}
      </button>
      {status === "failed" ? (
        <p role="alert" className="mt-sm text-text">
          {labels.failure}
        </p>
      ) : null}
    </form>
  );
}
