"use client";

import { useState, type FormEvent } from "react";

import { Field, inputClasses } from "@/components/ui/Field";
import { createLeadSchema } from "@/lib/lead-schema";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

export type LeadFormLabels = Dictionary["leadForm"];

type FieldName = "name" | "email" | "phone" | "company" | "message";

/**
 * Lead form — SHELL ONLY.
 *
 * Renders the real fields with real client-side validation, but does not
 * submit anywhere yet.
 *
 * PHASE-4 TODO: replace the stub in `handleSubmit` with a POST to /api/lead.
 * That route owns the parts that actually matter and cannot live here:
 * Upstash rate limiting, server-side re-validation with this same schema, the
 * service-role insert, and the lead-loss fallback from hard rule 6 (on
 * failure: log, fire the fallback email, still show the user success). Until
 * then this makes no network request of any kind.
 */
export function LeadForm({ labels }: { labels: LeadFormLabels }) {
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const schema = createLeadSchema(labels.errors);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData) as Record<FieldName, string>;
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

    // PHASE-4 TODO: POST result.data to /api/lead. Deliberately no fetch here.
    console.info("[lead-form] validated, not yet submitted", result.data);

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-lg border border-border bg-surface p-lg"
      >
        <h3 className="text-lg font-semibold text-text">
          {labels.successTitle}
        </h3>
        <p className="mt-2xs text-sm text-text-muted">{labels.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-md">
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

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-md bg-cta px-sm py-2xs text-sm font-semibold text-on-cta transition-colors hover:bg-cta-hover motion-reduce:transition-none"
      >
        {labels.submit}
      </button>
    </form>
  );
}
