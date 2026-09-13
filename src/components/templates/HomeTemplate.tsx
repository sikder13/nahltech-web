import { CtaBlock } from "@/components/blocks/CtaBlock";
import { FeaturedResearch } from "@/components/blocks/FeaturedResearch";
import { Hero } from "@/components/blocks/Hero";
import { MethodStrip } from "@/components/blocks/MethodStrip";
import { ProofBar } from "@/components/blocks/ProofBar";
import { MarketsLine } from "@/components/blocks/MarketsLine";
import { ServicesGrid } from "@/components/blocks/ServicesGrid";
import { TwoWaysBlock } from "@/components/blocks/TwoWaysBlock";
import {
  bookingCta,
  contactDetails,
  datasetReportPath,
  productLinks,
  routes,
  serviceRouteKeys,
} from "@/lib/routes";
import { serviceIcons } from "@/lib/service-icons";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

/** The one artifact the home page puts weight behind. */
export type FeaturedArticle = {
  title: string;
  description: string;
  href: string;
};

/**
 * T1 — home.
 *
 * Section order is fixed and deliberate: state the offer, prove it, frame the
 * problem, show the services, show the method, show the evidence, then ask
 * for the meeting. Do not reorder.
 */
export function HomeTemplate({
  t,
  featured,
}: {
  t: Dictionary;
  featured?: FeaturedArticle;
}) {
  return (
    <>
      <Hero
        headline={t.home.hero.headline}
        subline={t.home.hero.subline}
        primary={{
          label: t.cta.bookCall,
          href: bookingCta.href,
          external: bookingCta.external,
        }}
        secondary={{
          label: t.cta.visibilityCheck,
          href: `${routes.contact}#lead-form`,
        }}
      />

      <ProofBar
        heading={t.home.proof.heading}
        items={[
          {
            icon: "product",
            label: t.home.proof.items.product,
            href: productLinks.crawlmouse,
            external: true,
          },
          {
            icon: "app",
            label: t.home.proof.items.app,
            href: routes.hafsaSastho,
          },
          {
            icon: "research",
            label: t.home.proof.items.research,
            // The report itself, not the hub: this line quotes its figure.
            href: datasetReportPath,
          },
          {
            icon: "method",
            label: t.home.proof.items.method,
            href: routes.research,
          },
        ]}
      />

      <TwoWaysBlock
        heading={t.home.twoWays.heading}
        google={t.home.twoWays.google}
        ai={t.home.twoWays.ai}
      />

      <ServicesGrid
        heading={t.home.services.heading}
        services={[
          ...serviceRouteKeys.map((key) => ({
            title: t.services[key],
            description: t.serviceSummaries[key],
            href: routes[key],
            icon: serviceIcons[key],
          })),
          /* The Indianapolis landing page, sixth in the grid and not a sixth
             service — `serviceRouteKeys` is still five, and nothing derived
             from it changes. It earns a card here because this is the only
             section on the home page that lists destinations you can hire us
             through, and a page nothing links to is a page nobody finds.
             Both strings are read from what the page already publishes: its
             approved anchor and its own meta description, so the card cannot
             describe it differently than it describes itself. */
          {
            title: t.aiConsultingIndianapolis.anchor,
            description: t.pages.aiConsultingIndianapolis.description,
            href: routes.aiConsultingIndianapolis,
            icon: "pin" as const,
          },
          /* The manufacturers page, on the same terms as the card above: a
             destination you can hire us through, not a seventh service. The
             title is the founder's approved anchor for this placement and the
             description is the page's own meta description. The eye is an
             icon nothing else on this page uses; the bar charts were the
             first choice and read as a twin of AI Consultancy's at card size. */
          {
            title: t.manufacturing.inboundLinks.home.anchor,
            description: t.pages.manufacturing.description,
            href: routes.manufacturing,
            icon: "observe" as const,
          },
        ]}
        /* The markets, as one line rather than four more cards. The grid is
           already six tiles and a visitor scanning "What we do" is reading
           capabilities, not territories — but the four pages have to be
           reachable from the page that lists where you can hire us, or they
           are pages nothing links to. Same sentence /about and the
           Indianapolis page render, from the same key. */
        footer={
          <MarketsLine t={t} className="mt-lg max-w-prose text-text-muted" />
        }
      />

      <MethodStrip
        heading={t.home.method.heading}
        steps={[
          t.home.method.steps.observe,
          t.home.method.steps.analyze,
          t.home.method.steps.quantify,
          t.home.method.steps.build,
        ]}
      />

      {/* Back as of the first research publication. The title and excerpt are
          the artifact's own frontmatter rather than a copy in the dictionary,
          so the card cannot describe the document differently from the
          document. Absent when nothing is published — the section would
          otherwise advertise an empty page, which is why it was parked. */}
      {featured ? (
        <FeaturedResearch
          heading={t.home.featuredResearch.heading}
          title={featured.title}
          excerpt={featured.description}
          imageLabel={featured.title}
          cta={t.home.featuredResearch.cta}
          href={featured.href}
        />
      ) : null}

      <CtaBlock
        heading={t.ctaBlock.heading}
        body={t.ctaBlock.body}
        primary={{
          label: t.cta.bookCall,
          href: bookingCta.href,
          external: bookingCta.external,
        }}
        phone={{
          label: t.cta.phoneDisplay,
          href: contactDetails.phoneHref,
        }}
        orCallLabel={t.cta.orCall}
      />
    </>
  );
}
