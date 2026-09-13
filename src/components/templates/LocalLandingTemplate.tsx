import Link from "next/link";

import { CtaBlock } from "@/components/blocks/CtaBlock";
import { MarketsLine } from "@/components/blocks/MarketsLine";
import { FaqBlock } from "@/components/blocks/FaqBlock";
import { PageHeader } from "@/components/blocks/PageHeader";
import { FadeIn } from "@/components/ui/FadeIn";
import { Prose } from "@/components/ui/Prose";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bookingCta, contactDetails, routes } from "@/lib/routes";
import { localPricingRows } from "@/lib/pricing-mirror";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

const shell = "mx-auto max-w-(--container-page) px-sm py-2xl";

/**
 * T7 — local landing page.
 *
 * One page uses this today (`/ai-consulting-indianapolis`) and the name says
 * what it is rather than what it serves, because the shape is the reusable
 * part: lead, method, proof, audience, published prices, FAQ, ask. A second
 * city would pass a second dictionary slice and nothing else.
 *
 * It is not `ServiceTemplate`. That template sells one of the five services
 * and closes with the service lead form; this one sells the firm to a
 * visitor who arrived by city, and closes on the booking link and the phone
 * number, which is what the approved copy asks for.
 *
 * Bands alternate tinted and untinted so five consecutive prose sections do
 * not read as one wall — the same treatment `StorySection` gets on /about.
 */
export function LocalLandingTemplate({
  t,
  content,
}: {
  t: Dictionary;
  content: Dictionary["aiConsultingIndianapolis"];
}) {
  const rows = localPricingRows(t);

  return (
    <>
      <PageHeader
        title={t.pages.aiConsultingIndianapolis.title}
        intro={content.lead}
      />

      <section>
        <div className={shell}>
          <FadeIn>
            <SectionHeading>{content.method.heading}</SectionHeading>
            <Prose className="mt-md">
              <p>{content.method.intro}</p>
              {/* An ordered list because the copy calls them four steps and
                  the order is the method. */}
              <ol>
                {content.method.steps.map((step) => (
                  <li key={step.label}>
                    <strong>{step.label}</strong> {step.body}
                  </li>
                ))}
              </ol>
              <p>{content.method.closing}</p>
            </Prose>
          </FadeIn>
        </div>
      </section>

      <section className="bg-surface">
        <div className={shell}>
          <FadeIn>
            <SectionHeading>{content.proof.heading}</SectionHeading>
            <Prose className="mt-md">
              <ul>
                {content.proof.items.map((item) => (
                  <li key={item.slice(0, 40)}>{item}</li>
                ))}
              </ul>
            </Prose>
          </FadeIn>
        </div>
      </section>

      <section>
        <div className={shell}>
          <FadeIn>
            <SectionHeading>{content.audience.heading}</SectionHeading>
            <Prose className="mt-md">
              <p>{content.audience.intro}</p>
              <ul>
                {content.audience.items.map((item) => (
                  <li key={item.slice(0, 40)}>{item}</li>
                ))}
              </ul>
              <p>{content.audience.closing}</p>
              {/* The remote half of the same answer, and the only place this
                  sentence was supplied verbatim — /about and the home page
                  re-use these exact characters from the same key. It sits
                  here rather than in the FAQ because the section above it has
                  just finished saying who we work with locally. */}
              <MarketsLine t={t} />
              {/* The section's last sentence, as approved: the first bullet
                  above names manufacturers, and this sends them to the page
                  written for them. Founder's sentence verbatim; the anchor's
                  destination comes from the route registry. */}
              <p>
                {t.manufacturing.inboundLinks.aiConsultingIndianapolis.before}{" "}
                <Link href={routes.manufacturing}>
                  {t.manufacturing.inboundLinks.aiConsultingIndianapolis.anchor}
                </Link>
                {t.manufacturing.inboundLinks.aiConsultingIndianapolis.after}
              </p>
            </Prose>
          </FadeIn>
        </div>
      </section>

      <section className="bg-surface">
        <div className={shell}>
          <FadeIn>
            <SectionHeading>{content.pricing.heading}</SectionHeading>

            {/* Scrolls inside its own box rather than compressing to the
                viewport, and `tabIndex` is what makes that scroll reachable
                without a mouse (WCAG 2.1.1) — the same treatment article
                tables get. */}
            <div
              className="mt-lg max-w-(--container-measure) overflow-x-auto"
              tabIndex={0}
            >
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-border py-2xs pe-sm text-start align-bottom font-semibold text-text">
                      {content.pricing.columns.engagement}
                    </th>
                    <th className="border-b border-border py-2xs pe-sm text-start align-bottom font-semibold text-text">
                      {content.pricing.columns.price}
                    </th>
                    <th className="border-b border-border py-2xs pe-sm text-start align-bottom font-semibold text-text">
                      {content.pricing.columns.detail}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.engagement}>
                      <th
                        scope="row"
                        className="border-b border-divider py-2xs pe-sm text-start align-top font-medium text-text"
                      >
                        {row.engagement}
                      </th>
                      <td className="border-b border-divider py-2xs pe-sm align-top font-mono text-text tabular-nums">
                        {row.price}
                      </td>
                      <td className="border-b border-divider py-2xs pe-sm align-top text-text-muted">
                        {row.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* The rate card's own string, not a copy of it — /pricing
                renders this same key, so the promise cannot be worded one way
                here and another way there. */}
            <p className="mt-md max-w-prose border-s-4 border-accent ps-md text-text">
              {t.pricing.guarantee}
            </p>
            <p className="mt-md max-w-prose text-sm text-text-muted">
              {content.pricing.discounts}
            </p>
          </FadeIn>
        </div>
      </section>

      <FaqBlock heading={content.faq.heading} items={content.faq.items} />

      <CtaBlock
        heading={content.cta.heading}
        body={content.cta.body}
        primary={{
          label: content.cta.primaryLabel,
          href: bookingCta.href,
          external: bookingCta.external,
        }}
        phone={{ label: t.cta.phoneDisplay, href: contactDetails.phoneHref }}
        orCallLabel={t.cta.orCall}
        phoneNote={content.cta.phoneNote}
      />
    </>
  );
}
