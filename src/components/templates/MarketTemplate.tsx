import { CtaBlock } from "@/components/blocks/CtaBlock";
import { FaqBlock } from "@/components/blocks/FaqBlock";
import { PageHeader } from "@/components/blocks/PageHeader";
import { FadeIn } from "@/components/ui/FadeIn";
import { Prose } from "@/components/ui/Prose";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bookingCta, contactDetails } from "@/lib/routes";

import type { FaqItem } from "@/components/blocks/FaqBlock";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { MarketKey } from "@/lib/routes";

const shell = "mx-auto max-w-(--container-page) px-sm py-2xl";

/**
 * One band of a market page.
 *
 * Written out rather than inferred from the dictionary because the four
 * slices are not the same shape — one page's section carries bullets, the
 * next carries a paragraph, two carry both — and a union of four inferred
 * array types is unusable at the call site. Every field past the heading is
 * optional here, and a page supplies the ones its approved copy has.
 */
export type MarketSection = {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
  /**
   * The price-anchoring line, which is separately approved copy and belongs
   * immediately after whichever block quotes the figures — see the ordering
   * note on the component.
   */
  priceAnchor?: string;
};

export type MarketContent = {
  anchor: string;
  lead: string;
  sections: readonly MarketSection[];
  faq: { heading: string; items: readonly FaqItem[] };
  cta: { heading: string; body?: string; primaryLabel: string };
};

/**
 * T8 — market landing page.
 *
 * Four pages use this (`/markets/canada`, `/markets/gulf`,
 * `/markets/central-asia`, `/markets/new-zealand`); a fifth market would be a
 * route, a dictionary slice, and nothing else.
 *
 * It is deliberately thinner than `LocalLandingTemplate`. That page builds a
 * mirrored rate-card table because its approved copy asked for one; these
 * pages quote their prices inside prose, so there is no table to build and no
 * `pricing-mirror` call here. The figures are still held to `/pricing` — by
 * `markets.test.ts`, which reads every dollar amount out of the copy and
 * fails if one is not a figure the rate card publishes. Prose cannot be
 * mirrored, so it is asserted instead.
 *
 * A section renders in one fixed order — paragraphs, then bullets, then the
 * price-anchoring line — because that order *is* the approved copy: the
 * anchor sentence was written to land immediately after the block quoting the
 * numbers, and moving it changes what "for context" refers to.
 *
 * Bands alternate tinted and untinted, the same treatment the local landing
 * page gets, so consecutive prose sections do not read as one wall.
 */
export function MarketTemplate({
  t,
  market,
  content,
}: {
  t: Dictionary;
  market: MarketKey;
  content: MarketContent;
}) {
  return (
    <>
      <PageHeader title={t.pages[market].title} intro={content.lead} />

      {content.sections.map((section, index) => (
        <section
          key={section.heading}
          /* The lead sits on the page ground, so the first band tints and
             they alternate from there. */
          className={index % 2 === 0 ? "bg-surface" : undefined}
        >
          <div className={shell}>
            <FadeIn>
              <SectionHeading>{section.heading}</SectionHeading>
              <Prose className="mt-md">
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
                {section.items ? (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item.slice(0, 40)}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </Prose>

              {/* Set apart from the prose above it in the accent rule the
                  rate card's guarantee already uses: this line comments on
                  the figures rather than continuing the argument, and reads
                  as the aside it is. */}
              {section.priceAnchor ? (
                <p className="mt-md max-w-prose border-s-4 border-accent ps-md text-text">
                  {section.priceAnchor}
                </p>
              ) : null}
            </FadeIn>
          </div>
        </section>
      ))}

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
      />
    </>
  );
}
