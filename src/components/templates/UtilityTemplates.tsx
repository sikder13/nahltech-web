import { CtaBlock } from "@/components/blocks/CtaBlock";
import { PageHeader } from "@/components/blocks/PageHeader";
import {
  ContactChannels,
  CredentialsRow,
  PricingTable,
  StorySection,
  TeamGrid,
} from "@/components/blocks/utility-blocks";
import { LeadForm } from "@/components/conversion/LeadForm";
import { contactDetails, routes } from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

/** T6 — about. */
export function AboutTemplate({ t }: { t: Dictionary }) {
  return (
    <>
      <PageHeader title={t.pages.about.title} intro={t.about.intro} />
      <StorySection heading={t.about.storyHeading} body={t.about.storyBody} />
      <TeamGrid heading={t.about.teamHeading} members={t.about.team} />
      <CredentialsRow
        heading={t.about.credentialsHeading}
        items={t.about.credentials}
      />
      <CtaBlock
        heading={t.ctaBlock.heading}
        body={t.ctaBlock.body}
        primary={{ label: t.cta.bookCall, href: routes.contact }}
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
              <LeadForm t={t} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/** T6 — pricing. */
export function PricingTemplate({ t }: { t: Dictionary }) {
  return (
    <>
      <PageHeader title={t.pages.pricing.title} intro={t.pricing.intro} />
      <PricingTable
        tiersHeading={t.pricing.tiersHeading}
        tiers={t.pricing.tiers}
        projectsHeading={t.pricing.projectsHeading}
        projects={t.pricing.projects}
        ctaLabel={t.cta.bookCall}
        ctaHref={routes.contact}
      />
      <CtaBlock
        heading={t.ctaBlock.heading}
        body={t.ctaBlock.body}
        primary={{ label: t.cta.bookCall, href: routes.contact }}
        phone={{ label: t.cta.phoneDisplay, href: contactDetails.phoneHref }}
        orCallLabel={t.cta.orCall}
      />
    </>
  );
}
