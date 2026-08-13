"use client";

import { useState, type FormEvent } from "react";

import { Honeypot } from "@/components/conversion/Honeypot";
import { inputClasses } from "@/components/ui/Field";
import { collectAttribution } from "@/lib/attribution";
import { track } from "@/lib/analytics";

export type NewsletterFormLabels = {
  heading: string;
  sublabel: string;
  placeholder: string;
  button: string;
  success: string;
  /** Reuses the contact form's field label and error copy. */
  emailLabel: string;
  emailInvalid: string;
  rateLimited: string;
  networkError: string;
};

type Status = "idle" | "sending" | "sent" | "invalid" | "rateLimited" | "error";

/**
 * Footer newsletter signup, wired to POST /api/subscribe.
 *
 * The visible label is screen-reader-only: the heading above it already names
 * the form for sighted users, but the input still needs its own label rather
 * than leaning on the placeholder, which disappears the moment someone types.
 */
export function NewsletterForm({ labels }: { labels: NewsletterFormLabels }) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const values = Object.fromEntries(
      new FormData(event.currentTarget),
    ) as Record<string, string>;
    const email = (values.email ?? "").trim();

    // Cheap shape check so an obvious typo does not cost a round trip; the
    // route runs the real validation.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("invalid");
      return;
    }

    setStatus("sending");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          source_page: collectAttribution().landing_page,
          locale: collectAttribution().locale,
          website_url: values.website_url ?? "",
        }),
      });

      if (response.status === 429) {
        setStatus("rateLimited");
        return;
      }
      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("sent");
      track({ name: "subscribe" });
    } catch {
      setStatus("error");
    }
  }

  const message =
    status === "invalid"
      ? labels.emailInvalid
      : status === "rateLimited"
        ? labels.rateLimited
        : status === "error"
          ? labels.networkError
          : null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-text">{labels.heading}</h2>
      <p className="mt-3xs max-w-prose text-sm text-text-muted">
        {labels.sublabel}
      </p>

      {status === "sent" ? (
        <p role="status" className="mt-xs text-sm font-medium text-text">
          {labels.success}
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="relative mt-xs flex flex-col gap-2xs sm:max-w-prose sm:flex-row"
        >
          <Honeypot />

          <label htmlFor="newsletter-email" className="sr-only">
            {labels.emailLabel}
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={labels.placeholder}
            aria-invalid={status === "invalid"}
            aria-describedby={message ? "newsletter-status" : undefined}
            className={inputClasses(status === "invalid")}
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-cta px-sm py-2xs text-sm font-semibold text-on-cta transition-colors hover:bg-cta-hover disabled:opacity-60 motion-reduce:transition-none"
          >
            {labels.button}
          </button>
        </form>
      )}

      {message ? (
        <p
          id="newsletter-status"
          role="alert"
          className="mt-3xs text-sm font-medium text-text"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
