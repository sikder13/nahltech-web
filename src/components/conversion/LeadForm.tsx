"use client";

import { useState, type FormEvent } from "react";

import { Honeypot } from "@/components/conversion/Honeypot";
import { Field, inputClasses } from "@/components/ui/Field";
import { track } from "@/lib/analytics";
import { collectAttribution } from "@/lib/attribution";
import { createLeadSchema } from "@/lib/lead-schema";
import { bookingUrl, contactDetails } from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { LeadSource, ServiceInterest } from "@/lib/supabase/types";

export type LeadFormLabels = Dictionary["leadForm"];
export type LeadFormCta = { callLabel: string; bookCall: string };

/**
 * The surfaces this component is actually rendered on.
 *
 * Narrower than `LeadSource` on purpose: the chat widget posts through
 * `ChatConsentForm`, and the remaining enum members are set by hand on rows
 * that never came from a form at all. Derived with `Extract` rather than
 * retyped, so a rename in the enum breaks the build here too.
 */
export type LeadFormSource = Extract<
  LeadSource,
  "contact_form" | "service_page"
>;

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
 *
 * The service pages render the same component in `compact` mode rather than a
 * second form of their own. One form means one validation contract, one
 * honeypot, one success state and one place a bug can live — the alternative
 * was five more submit handlers agreeing with this one by hand.
 */
export function LeadForm({
  labels,
  cta,
  compact = false,
  source = "contact_form",
  serviceInterest,
  idPrefix = "",
}: {
  labels: LeadFormLabels;
  cta: LeadFormCta;
  /**
   * Name, email and message only. Phone and company are the fields people
   * abandon a form over, and a service page has already earned less patience
   * than the contact page — the visitor came to read, not to fill anything in.
   */
  compact?: boolean;
  /** Which surface this lead came from. Widened by migration 0004. */
  source?: LeadFormSource;
  /** Set by a service page so the lead arrives already classified. */
  serviceInterest?: ServiceInterest;
  /**
   * Namespaces the field ids. Two forms on one page would otherwise share
   * `id="name"`, and a duplicate id silently breaks every `label for` after
   * the first — which is a screen-reader bug, not a cosmetic one.
   */
  idPrefix?: string;
}) {
  const fieldId = (name: string) => (idPrefix ? `${idPrefix}-${name}` : name);
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
          source,
          // Omitted rather than sent empty: the column is nullable and the
          // server enum has no blank member.
          ...(serviceInterest ? { service_interest: serviceInterest } : {}),
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
      track({ name: "lead_submit", source });
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
          {/* Booking leads, phone follows. The guard stays because the type
              admits null: if the booking page is ever retired, this degrades
              to the phone number rather than a dead anchor (hard rule 7). */}
          {bookingUrl ? (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
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

      <Field
        id={fieldId("name")}
        label={labels.name}
        error={errors.name}
        required
      >
        <input
          id={fieldId("name")}
          name="name"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={
            errors.name ? `${fieldId("name")}-error` : undefined
          }
          className={inputClasses(Boolean(errors.name))}
        />
      </Field>

      <Field
        id={fieldId("email")}
        label={labels.email}
        error={errors.email}
        required
      >
        <input
          id={fieldId("email")}
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={
            errors.email ? `${fieldId("email")}-error` : undefined
          }
          className={inputClasses(Boolean(errors.email))}
        />
      </Field>

      {compact ? null : (
        <>
          <Field
            id={fieldId("phone")}
            label={labels.phone}
            error={errors.phone}
          >
            <input
              id={fieldId("phone")}
              name="phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={
                errors.phone ? `${fieldId("phone")}-error` : undefined
              }
              className={inputClasses(Boolean(errors.phone))}
            />
          </Field>

          <Field
            id={fieldId("company")}
            label={labels.company}
            error={errors.company}
          >
            <input
              id={fieldId("company")}
              name="company"
              type="text"
              autoComplete="organization"
              aria-invalid={Boolean(errors.company)}
              aria-describedby={
                errors.company ? `${fieldId("company")}-error` : undefined
              }
              className={inputClasses(Boolean(errors.company))}
            />
          </Field>
        </>
      )}

      <Field
        id={fieldId("message")}
        label={labels.message}
        error={errors.message}
      >
        <textarea
          id={fieldId("message")}
          name="message"
          rows={compact ? 4 : 5}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? `${fieldId("message")}-error` : undefined
          }
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

      {/* `min-h-11` is 44px — the WCAG 2.5.5 target size, and the width of a
          fingertip. The padding alone left it a few pixels short. */}
      <button
        type="submit"
        disabled={sending}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-cta px-sm py-2xs text-sm font-semibold text-on-cta transition-colors hover:bg-cta-hover disabled:opacity-60 motion-reduce:transition-none"
      >
        {sending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
