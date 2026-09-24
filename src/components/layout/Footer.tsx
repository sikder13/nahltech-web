import { NewsletterForm } from "@/components/conversion/NewsletterForm";

import { FooterBase } from "./FooterBase";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

/** The site footer, as on every page of nahltech.com: links plus the newsletter form. */
export function Footer({ t }: { t: Dictionary }) {
  return (
    <FooterBase
      t={t}
      newsletter={
        <NewsletterForm
          labels={{
            ...t.newsletter,
            // Reuses the contact form's already-approved field label and
            // error copy rather than introducing a second wording for the
            // same thing.
            emailLabel: t.leadForm.email,
            emailInvalid: t.leadForm.errors.emailInvalid,
            rateLimited: t.leadForm.rateLimited,
            networkError: t.leadForm.networkError,
          }}
        />
      }
    />
  );
}
