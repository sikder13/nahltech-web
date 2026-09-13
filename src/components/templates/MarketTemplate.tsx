import Link from "next/link";

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
  /**
   * A paragraph with one link inside it, split where the anchor sits.
   *
   * For approved copy whose link is mid-sentence, which neither field below
   * can carry: `trailingLinkAnchor` only appends to a bullet and
   * `trailingSentence` only ends on its anchor. `before` renders followed by
   * one space and `after` renders exactly as written, so the three rejoin to
   * the approved paragraph character for character; the destination comes
   * from `trailingLinkHref`. Without one the words still render, unlinked —
   * unlike the two fields below, these are the section's body, not an aside.
   */
  linkedParagraph?: { before: string; anchor: string; after: string };
  items?: readonly string[];
  /**
   * The price-anchoring line, which is separately approved copy and belongs
   * immediately after whichever block quotes the figures — see the ordering
   * note on the component.
   */
  priceAnchor?: string;
  /**
   * Anchor text for a link appended to this section's last bullet.
   *
   * One section has one today: the Canada page's funding bullet, whose
   * approved sentence was written with the link in mind and carried a
   * placeholder until the guide existed. The href is not in the dictionary —
   * it comes from the route registry through `trailingLinkHref`, so the
   * anchor cannot outlive its target.
   */
  trailingLinkAnchor?: string;
  /**
   * A closing sentence for the section, carrying one link.
   *
   * Distinct from `trailingLinkAnchor`, which appends an anchor inside the
   * last bullet. This renders its own paragraph after the section body, for
   * approved copy that is a sentence rather than a suffix — the Gulf page's
   * pointer at the regional study. `lead` is the text before the anchor; the
   * destination comes from `trailingLinkHref`.
   */
  trailingSentence?: { lead: string; anchor: string };
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
 * A section renders in one fixed order — paragraphs, then the linked
 * paragraph, then bullets, then the price-anchoring line — because that
 * order *is* the approved copy: the
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
  trailingLinkHref,
}: {
  t: Dictionary;
  market: MarketKey;
  content: MarketContent;
  /**
   * Destination for every link the page's sections declare — a
   * `trailingLinkAnchor`, a `trailingSentence` or a `linkedParagraph`. One
   * href serves them all because each market page links one document: the
   * Canada page's two links both go to the funding guide. Passed by the page
   * rather than read here, because the target is a slug and this template
   * has no business knowing which document that is.
   */
  trailingLinkHref?: string;
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
                {section.linkedParagraph ? (
                  <p>
                    {section.linkedParagraph.before}{" "}
                    {trailingLinkHref ? (
                      <Link href={trailingLinkHref}>
                        {section.linkedParagraph.anchor}
                      </Link>
                    ) : (
                      section.linkedParagraph.anchor
                    )}
                    {section.linkedParagraph.after}
                  </p>
                ) : null}
                {section.items ? (
                  <ul>
                    {section.items.map((item, itemIndex) => {
                      /* The link rides on the last bullet, which is where the
                         approved sentence that wanted it sits. It renders
                         only when the page supplies a destination — an anchor
                         with nowhere to go is worse than no anchor. */
                      const linked =
                        section.trailingLinkAnchor &&
                        trailingLinkHref &&
                        itemIndex === section.items!.length - 1;

                      return (
                        <li key={item.slice(0, 40)}>
                          {item}
                          {linked ? (
                            <>
                              {" "}
                              <Link href={trailingLinkHref}>
                                {section.trailingLinkAnchor}
                              </Link>
                            </>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </Prose>

              {/* The section's closing sentence, when its approved copy has
                  one. Inside the Prose column so it reads as the last line of
                  the argument rather than a separate block, and rendered only
                  with a destination — an anchor with nowhere to go is worse
                  than no anchor. */}
              {section.trailingSentence && trailingLinkHref ? (
                <Prose className="mt-md">
                  <p>
                    {section.trailingSentence.lead}{" "}
                    <Link href={trailingLinkHref}>
                      {section.trailingSentence.anchor}
                    </Link>
                    .
                  </p>
                </Prose>
              ) : null}

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
