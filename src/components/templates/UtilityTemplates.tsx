import Link from "next/link";

import { CtaBlock } from "@/components/blocks/CtaBlock";
import { PageHeader } from "@/components/blocks/PageHeader";
import {
  ClosingLine,
  ContactChannels,
  CredentialsRow,
  DiscountsBlock,
  FoundingBanner,
  PricingTable,
  StorySection,
  TeamGrid,
} from "@/components/blocks/utility-blocks";
import { LeadForm } from "@/components/conversion/LeadForm";
import { FadeIn } from "@/components/ui/FadeIn";
import { Prose } from "@/components/ui/Prose";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bookingCta, contactDetails, routes } from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { ServiceKey } from "@/lib/routes";

/**
 * The five services in the order the About copy lists them, which is not
 * `serviceRouteKeys` order. Written out rather than derived, because the
 * sequence is an editorial decision; the hrefs still come from the route
 * registry, so an anchor here cannot outlive the page it points at.
 */
const aboutServices = [
  "aiConsultancy",
  "aiAutomation",
  "softwareDevelopment",
  "webDevelopment",
  "aiSearchVisibility",
] as const satisfies readonly ServiceKey[];

/**
 * T6 — about.
 *
 * Three prose bands, the work in plain terms, then the founders. The order is
 * the argument the page makes: who we are, what the work actually looks like,
 * what we have shipped for ourselves, where to read about each service — and
 * only then the two faces. The second prose band is tinted so three
 * consecutive runs of prose do not read as one wall of text.
 *
 * The services band is the page's only in-content route to the five service
 * pages, which is why it is a list of sentences rather than a card grid: it
 * reads as part of the story, and its anchors say what they point at.
 */
export function AboutTemplate({ t }: { t: Dictionary }) {
  return (
    <>
      <PageHeader title={t.pages.about.title} />
      <StorySection
        heading={t.about.storyHeading}
        paragraphs={t.about.storyParagraphs}
      />
      <StorySection
        heading={t.about.whatWeDoHeading}
        paragraphs={t.about.whatWeDoParagraphs}
        surface
      />
      <StorySection
        heading={t.about.whatWeBuiltHeading}
        paragraphs={t.about.whatWeBuiltParagraphs}
      />
      {/* Untinted on purpose: the founders band below is tinted, and tinting
          this one would leave the italic sign-off stranded on a white strip
          between two tinted bands. The heading rule and the bullets already
          separate it from the prose above. */}
      <section>
        <div className="mx-auto max-w-(--container-page) px-sm py-2xl">
          <FadeIn>
            <SectionHeading>{t.about.services.heading}</SectionHeading>
            <Prose className="mt-md">
              <p>{t.about.services.intro}</p>
              <ul>
                {aboutServices.map((key) => (
                  <li key={key}>
                    <Link href={routes[key]}>
                      {t.about.services.items[key].label}
                    </Link>{" "}
                    — {t.about.services.items[key].description}
                  </li>
                ))}
              </ul>
            </Prose>
          </FadeIn>
        </div>
      </section>
      <ClosingLine>{t.about.closingLine}</ClosingLine>
      <TeamGrid heading={t.about.teamHeading} members={t.about.team} />
      <CredentialsRow
        heading={t.about.credentialsHeading}
        items={t.about.credentials}
      />
      <CtaBlock
        heading={t.ctaBlock.heading}
        body={t.ctaBlock.body}
        primary={{
          label: t.cta.bookCall,
          href: bookingCta.href,
          external: bookingCta.external,
        }}
        phone={{ label: t.cta.phoneDisplay, href: contactDetails.phoneHref }}
        orCallLabel={t.cta.orCall}
      />
    </>
  );
}

/**
 * T6 — contact. Two columns: how to reach us on the left, the form on the
 * right. The form section carries id="lead-form" because the home hero's
 * secondary CTA links straight to it.
 */
export function ContactTemplate({ t }: { t: Dictionary }) {
  return (
    <>
      <PageHeader title={t.pages.contact.title} intro={t.contact.intro} />
      <div className="mx-auto max-w-(--container-page) px-sm pb-2xl">
        <div className="grid gap-xl lg:grid-cols-2">
          <ContactChannels
            heading={t.contact.channelsHeading}
            channels={[
              {
                icon: "phone",
                label: t.contact.phoneLabel,
                value: t.cta.phoneDisplay,
                href: contactDetails.phoneHref,
              },
              {
                icon: "mail",
                label: t.contact.emailLabel,
                value: contactDetails.email,
                href: contactDetails.emailHref,
              },
              {
                icon: "pin",
                label: t.contact.addressLabel,
                value: `${t.footer.street}\n${t.footer.cityRegionPostal}`,
              },
            ]}
          />

          <section id="lead-form" aria-labelledby="lead-form-heading">
            <h2
              id="lead-form-heading"
              className="text-xl font-semibold text-text"
            >
              {t.contact.formHeading}
            </h2>
            <span className="mt-xs heading-rule" aria-hidden="true" />
            <p className="mt-md text-sm text-text-muted">
              {t.contact.formIntro}
            </p>
            <div className="mt-md">
              <LeadForm
                labels={t.leadForm}
                cta={{ callLabel: t.cta.callLabel, bookCall: t.cta.bookCall }}
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/**
 * T6 — pricing.
 *
 * The whole page is the argument: published numbers, in order of commitment,
 * with the founding-client terms stated plainly at the top rather than as a
 * pop-up. Nothing here is a live counter.
 */
export function PricingTemplate({ t }: { t: Dictionary }) {
  return (
    <>
      <PageHeader title={t.pricing.headline} intro={t.pricing.intro} />

      <FoundingBanner
        heading={t.pricing.founding.heading}
        body={t.pricing.founding.body}
      />

      <PricingTable
        tiers={t.pricing.tiers}
        projectsHeading={t.pricing.projectsHeading}
        projects={t.pricing.projects}
        featuredLabel={t.pricing.featuredLabel}
        ctaHref={routes.contact}
      />

      <DiscountsBlock
        heading={t.pricing.discounts.heading}
        items={t.pricing.discounts.items}
        community={t.pricing.discounts.community}
        footnote={t.pricing.discounts.footnote}
      />

      <CtaBlock
        heading={t.ctaBlock.heading}
        body={t.ctaBlock.body}
        primary={{
          label: t.cta.bookCall,
          href: bookingCta.href,
          external: bookingCta.external,
        }}
        phone={{ label: t.cta.phoneDisplay, href: contactDetails.phoneHref }}
        orCallLabel={t.cta.orCall}
      />
    </>
  );
}
