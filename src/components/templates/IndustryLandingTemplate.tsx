import Link from "next/link";
import { Fragment } from "react";

import { CtaBlock } from "@/components/blocks/CtaBlock";
import { FaqBlock } from "@/components/blocks/FaqBlock";
import { PageHeader } from "@/components/blocks/PageHeader";
import { FadeIn } from "@/components/ui/FadeIn";
import { Prose } from "@/components/ui/Prose";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  bookingCta,
  canadaFundingGuidePath,
  contactDetails,
  indianaGrantsGuidePath,
  manufacturingPiecePaths,
  routes,
  type ManufacturingPieceKey,
} from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

const shell = "mx-auto max-w-(--container-page) px-sm py-2xl";

/**
 * Destinations for the grants paragraph's runs, in the copy's order: the
 * Indiana guide, then the Canada guide. Matched by position, which the type
 * system cannot check against a JSON array, so the template test pins both
 * anchors to these exact hrefs: a run added or reordered in the copy fails
 * there rather than shipping a link to the wrong guide.
 */
const grantsLinks = [indianaGrantsGuidePath, canadaFundingGuidePath] as const;

/**
 * A sentence carrying one link, split where the anchor sits.
 *
 * `before` renders followed by one space, the same join every other inbound
 * link on the site uses; `after` renders exactly as written, so it carries
 * its own leading space or punctuation. Joined that way the parts are the
 * approved sentence character for character, which the tests assert. The
 * href is never in the copy — it comes from the route registry at the call
 * site, so an anchor cannot outlive its destination.
 */
type LinkedCopy = { before?: string; anchor: string; after?: string };

function LinkedSentence({ copy, href }: { copy: LinkedCopy; href: string }) {
  return (
    <>
      {copy.before ? `${copy.before} ` : null}
      <Link href={href}>{copy.anchor}</Link>
      {copy.after}
    </>
  );
}

/**
 * T9 — industry landing page.
 *
 * One page uses this today (`/manufacturing`). It is built from the same
 * blocks as `LocalLandingTemplate` and closes the same way — FAQ, then the
 * booking link and the phone number — but it is neither that template nor
 * `MarketTemplate`. The city page mirrors the rate card into a table and this
 * copy has no table; the market pages can only hang a link off the end of a
 * section, and this copy puts two of its links mid-sentence. Stretching
 * either to fit would have put a manufacturing-shaped branch inside a
 * template five other pages render through.
 *
 * The four pieces render in the order `manufacturingPiecePaths` declares,
 * which is the order the approved copy lists them. Each anchor is looked up
 * by the same key its destination is, so a piece added to one side and not
 * the other is a type error rather than a link to nowhere.
 *
 * Bands alternate untinted and tinted from the first section, as the city
 * page's do, so that the FAQ lands untinted and the CTA tinted after it.
 */
export function IndustryLandingTemplate({
  t,
  content,
}: {
  t: Dictionary;
  content: Dictionary["manufacturing"];
}) {
  const pieces = (
    Object.keys(manufacturingPiecePaths) as ManufacturingPieceKey[]
  ).map((key) => ({
    key,
    copy: content.work.items[key],
    href: manufacturingPiecePaths[key],
  }));

  return (
    <>
      <PageHeader title={t.pages.manufacturing.title} intro={content.lead} />

      <section>
        <div className={shell}>
          <FadeIn>
            <SectionHeading>{content.gap.heading}</SectionHeading>
            <Prose className="mt-md">
              {content.gap.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </Prose>
          </FadeIn>
        </div>
      </section>

      <section className="bg-surface">
        <div className={shell}>
          <FadeIn>
            <SectionHeading>{content.work.heading}</SectionHeading>
            <Prose className="mt-md">
              <p>{content.work.intro}</p>
              <ul>
                {pieces.map((piece) => (
                  <li key={piece.key}>
                    <LinkedSentence copy={piece.copy} href={piece.href} />
                  </li>
                ))}
              </ul>
            </Prose>
          </FadeIn>
        </div>
      </section>

      <section>
        <div className={shell}>
          <FadeIn>
            <SectionHeading>{content.engagement.heading}</SectionHeading>
            <Prose className="mt-md">
              <p>
                <LinkedSentence
                  copy={content.engagement.paragraph}
                  href={routes.pricing}
                />
              </p>
            </Prose>
          </FadeIn>
        </div>
      </section>

      <section className="bg-surface">
        <div className={shell}>
          <FadeIn>
            <SectionHeading>{content.grants.heading}</SectionHeading>
            <Prose className="mt-md">
              {/* One paragraph carrying two links, stored as two runs, each
                  ending on or just after its link: Indiana's, then Canada's.
                  The runs join with one space, so the paragraph reads as the
                  approved text. Each run's destination is matched here by
                  position, in the copy's order. */}
              <p>
                {content.grants.paragraph.map((run, index) => (
                  <Fragment key={run.anchor}>
                    {index > 0 ? " " : null}
                    <LinkedSentence copy={run} href={grantsLinks[index]} />
                  </Fragment>
                ))}
              </p>
            </Prose>
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
