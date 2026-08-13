"use client";

import { useState, type FormEvent } from "react";

import { Honeypot } from "@/components/conversion/Honeypot";
import { Field, inputClasses } from "@/components/ui/Field";
import { collectAttribution } from "@/lib/attribution";
import { track } from "@/lib/analytics";

export type ChatConsentLabels = {
  name: string;
  email: string;
  phone: string;
  message: string;
  submit: string;
  sending: string;
  rateLimited: string;
  networkError: string;
  errors: {
    nameRequired: string;
    emailRequired: string;
    emailInvalid: string;
  };
};

type Status = "idle" | "sending" | "sent" | "rateLimited" | "networkError";
type FieldName = "name" | "email";

/**
 * Consent-explicit lead capture from inside the chat (ARCH-1 §4.2).
 *
 * Nothing here is automatic. The widget offers this form when it notices
 * contact details in the conversation, but the visitor types them again and
 * presses the button themselves — we never scrape an address out of a message
 * and submit it on their behalf.
 *
 * Email is required rather than "email or phone" because /api/lead and the
 * contact form both require a valid email, and relaxing that contract for one
 * entry point would let two sources disagree about what a lead is.
 *
 * Confirmation is the caller's job, via `onSaved`. The panel renders it into
 * the thread and this form unmounts, so owning a success state here would put
 * the same sentence in two places and let them drift apart.
 */
export function ChatConsentForm({
  labels,
  conversationId,
  onSaved,
}: {
  labels: ChatConsentLabels;
  conversationId: string | null;
  onSaved?: () => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const values = Object.fromEntries(
      new FormData(event.currentTarget),
    ) as Record<string, string>;

    const name = (values.name ?? "").trim();
    const email = (values.email ?? "").trim();

    const next: Partial<Record<FieldName, string>> = {};
    if (!name) next.name = labels.errors.nameRequired;
    if (!email) next.email = labels.errors.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = labels.errors.emailInvalid;

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    setStatus("sending");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: (values.phone ?? "").trim(),
          company: "",
          message: (values.message ?? "").trim(),
          ...collectAttribution(),
          source: "chat_widget",
          // Ties the lead back to the transcript it came out of.
          conversation_id: conversationId ?? "",
          website_url: values.website_url ?? "",
        }),
      });

      if (response.status === 429) {
        setStatus("rateLimited");
        return;
      }
      if (!response.ok) {
        setStatus("networkError");
        return;
      }

      setStatus("sent");
      track({ name: "lead_submit", source: "chat_widget" });
      track({ name: "chat_lead_saved" });
      onSaved?.();
    } catch {
      setStatus("networkError");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="relative space-y-xs rounded-md border border-border bg-bg p-xs"
    >
      <Honeypot />

      <Field id="chat-name" label={labels.name} error={errors.name} required>
        <input
          id="chat-name"
          name="name"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "chat-name-error" : undefined}
          className={inputClasses(Boolean(errors.name))}
        />
      </Field>

      <Field id="chat-email" label={labels.email} error={errors.email} required>
        <input
          id="chat-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "chat-email-error" : undefined}
          className={inputClasses(Boolean(errors.email))}
        />
      </Field>

      <Field id="chat-phone" label={labels.phone}>
        <input
          id="chat-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className={inputClasses(false)}
        />
      </Field>

      <Field id="chat-need" label={labels.message}>
        <input
          id="chat-need"
          name="message"
          type="text"
          className={inputClasses(false)}
        />
      </Field>

      {status === "rateLimited" || status === "networkError" ? (
        <p role="alert" className="text-sm font-medium text-text">
          {status === "rateLimited" ? labels.rateLimited : labels.networkError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center justify-center rounded-md bg-cta px-sm py-2xs text-sm font-semibold text-on-cta transition-colors hover:bg-cta-hover disabled:opacity-60 motion-reduce:transition-none"
      >
        {status === "sending" ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
