import { LeadForm } from "@/components/conversion/LeadForm";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bookingCta, bookingUrl, contactDetails } from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { ServiceInterest } from "@/lib/supabase/types";

/**
 * The foot of every service page: book a call, or write to us here.
 *
 * This replaces the CtaBlock that used to close these pages. That block asked
 * the visitor to go somewhere else to do anything — a link to /contact at the
 * end of a page they had just read all the way through, which is a step that
 * exists for our routing convenience rather than theirs. The form is on the
 * page they are already on.
 *
 * The lead arrives classified. `service_interest` is set from the page rather
 * than from a dropdown the visitor has to fill in, because the page they read
 * is better evidence of what they want than a field they would skip.
 */
export function ServiceContact({
  t,
  serviceInterest,
}: {
  t: Dictionary;
  serviceInterest: ServiceInterest;
}) {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-(--container-page) px-sm py-2xl">
        <FadeIn>
          <SectionHeading>{t.serviceContact.heading}</SectionHeading>
          <p className="mt-xs max-w-prose text-sm text-text-muted">
            {t.serviceContact.body}
          </p>

          {/* Form first in the source order as well as on screen at desktop:
              it is the thing being offered, and on a phone the booking card
              should not push it below another scroll. */}
          <div className="mt-lg grid gap-lg lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="rounded-lg border border-border bg-bg p-md">
              <LeadForm
                labels={t.leadForm}
                cta={{ callLabel: t.cta.callLabel, bookCall: t.cta.bookCall }}
                compact
                source="service_page"
                serviceInterest={serviceInterest}
                // Namespaced so these ids cannot collide with anything else
                // that lands on a service page later.
                idPrefix="service"
              />
            </div>

            {/* No new copy here on purpose. The brief specified the heading
                and sub-line above and nothing for this card, and hard rule 12
                means an unwritten line stays unwritten — so it carries the
                booking sentence already approved for exactly this job. */}
            <aside className="h-fit rounded-lg border-s-4 border-accent bg-bg p-md">
              <p className="text-sm text-text">{t.ctaSlim.body}</p>
              <div className="mt-md flex flex-col gap-2xs">
                {/* Guarded because the type admits null: if booking is ever
                    retired this degrades to the phone number rather than a
                    dead anchor (hard rule 7). */}
                {bookingUrl ? (
                  <a
                    href={bookingCta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-cta px-sm py-2xs text-sm font-semibold text-on-cta transition-colors hover:bg-cta-hover motion-reduce:transition-none"
                  >
                    {t.cta.bookCall}
                  </a>
                ) : null}
                <a
                  href={contactDetails.phoneHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-sm py-2xs text-sm font-semibold text-text transition-colors hover:bg-surface motion-reduce:transition-none"
                >
                  {t.cta.phoneDisplay}
                </a>
              </div>
            </aside>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
