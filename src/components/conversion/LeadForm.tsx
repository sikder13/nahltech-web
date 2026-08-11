"use client";

import { useState, type FormEvent } from "react";

import { Honeypot } from "@/components/conversion/Honeypot";
import { Field, inputClasses } from "@/components/ui/Field";
import { collectAttribution } from "@/lib/attribution";
import { createLeadSchema } from "@/lib/lead-schema";
import { bookingUrl, contactDetails } from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

export type LeadFormLabels = Dictionary["leadForm"];
export type LeadFormCta = { callLabel: string; bookCall: string };

type FieldName = "name" | "email" | "phone" | "company" | "message";
type Status = "idle" | "sending" | "sent" | "rateLimited" | "networkError";

/**
 * Contact form, wired to POST /api/lead.
 *
 * The client-side zod pass is a courtesy that saves a round trip; the route
 * re-validates the same shape and is the actual enforcement point (hard rule
 * 5). A 200 is always treated as success — the route answers 200 even when the
 * insert failed, because by then the enquiry has already been emailed and the
 * lead is recoverable (hard rule 6). Only a 429 or a dead network surfaces to
 * the visitor as anything other than success.
 */
export function LeadForm({
  labels,
  cta,
}: {
  labels: LeadFormLabels;
  cta: LeadFormCta;
}) {
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  const schema = createLeadSchema(labels.errors);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData) as Record<string, string>;
    const result = schema.safeParse(values);

    if (!result.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as FieldName | undefined;
        if (key && !next[key]) next[key] = issue.message;
      }
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
          ...result.data,
          ...collectAttribution(),
          source: "contact_form",
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
    } catch {
      setStatus("networkError");
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        className="rounded-lg border border-border bg-surface p-lg"
      >
        <h3 className="text-lg font-semibold text-text">
          {labels.successTitle}
        </h3>
        <p className="mt-2xs text-sm text-text-muted">{labels.successBody}</p>
        <div className="mt-md flex flex-wrap gap-xs">
          {/* Booking is offered only once there is somewhere to book; until
              then the phone number is the immediate channel (hard rule 7). */}
          {bookingUrl ? (
            <a
              href={bookingUrl}
              className="inline-flex items-center justify-center rounded-md bg-cta px-sm py-2xs text-sm font-semibold text-on-cta transition-colors hover:bg-cta-hover motion-reduce:transition-none"
            >
              {cta.bookCall}
            </a>
          ) : null}
          <a
            href={contactDetails.phoneHref}
            className="inline-flex items-center justify-center rounded-md border border-border px-sm py-2xs text-sm font-semibold text-text transition-colors hover:bg-bg motion-reduce:transition-none"
          >
            {cta.callLabel}
          </a>
        </div>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form onSubmit={handleSubmit} noValidate className="relative space-y-md">
      <Honeypot />

      <Field id="name" label={labels.name} error={errors.name} required>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={inputClasses(Boolean(errors.name))}
        />
      </Field>

      <Field id="email" label={labels.email} error={errors.email} required>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={inputClasses(Boolean(errors.email))}
        />
      </Field>

      <Field id="phone" label={labels.phone} error={errors.phone}>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "phone-error" : undefined}
          className={inputClasses(Boolean(errors.phone))}
        />
      </Field>

      <Field id="company" label={labels.company} error={errors.company}>
        <input
          id="company"
          name="company"
          type="text"
          autoComplete="organization"
          aria-invalid={Boolean(errors.company)}
          aria-describedby={errors.company ? "company-error" : undefined}
          className={inputClasses(Boolean(errors.company))}
        />
      </Field>

      <Field id="message" label={labels.message} error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={5}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={inputClasses(Boolean(errors.message))}
        />
      </Field>

      {status === "rateLimited" || status === "networkError" ? (
        <p role="alert" className="text-sm font-medium text-text">
          {status === "rateLimited" ? labels.rateLimited : labels.networkError}{" "}
          <a href={contactDetails.phoneHref} className="link-accent">
            {cta.callLabel}
          </a>
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center justify-center rounded-md bg-cta px-sm py-2xs text-sm font-semibold text-on-cta transition-colors hover:bg-cta-hover disabled:opacity-60 motion-reduce:transition-none"
      >
        {sending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
