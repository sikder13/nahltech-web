import { CtaBlock } from "@/components/blocks/CtaBlock";
import { FeaturedResearch } from "@/components/blocks/FeaturedResearch";
import { Hero } from "@/components/blocks/Hero";
import { MethodStrip } from "@/components/blocks/MethodStrip";
import { ProofBar } from "@/components/blocks/ProofBar";
import { ServicesGrid } from "@/components/blocks/ServicesGrid";
import { TwoWaysBlock } from "@/components/blocks/TwoWaysBlock";
import { contactDetails, routes } from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * T1 — home.
 *
 * Section order is fixed and deliberate: state the offer, prove it, frame the
 * problem, show the services, show the method, show the evidence, then ask
 * for the meeting. Do not reorder.
 */
export function HomeTemplate({ t }: { t: Dictionary }) {
  return (
    <>
      <Hero
        headline={t.home.hero.headline}
        subline={t.home.hero.subline}
        primary={{ label: t.cta.bookCall, href: routes.contact }}
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
            href: "https://crawlmouse.com",
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
            href: routes.research,
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
          {
            title: t.services.aiSearchVisibility,
            description: t.serviceSummaries.aiSearchVisibility,
            href: routes.aiSearchVisibility,
            icon: "sparkle",
          },
          {
            title: t.services.localSeo,
            description: t.serviceSummaries.localSeo,
            href: routes.localSeo,
            icon: "pin",
          },
          {
            title: t.services.webDevelopment,
            description: t.serviceSummaries.webDevelopment,
            href: routes.webDevelopment,
            icon: "build",
          },
          {
            title: t.services.aiAutomation,
            description: t.serviceSummaries.aiAutomation,
            href: routes.aiAutomation,
            icon: "method",
          },
        ]}
      />

      <MethodStrip
        heading={t.home.method.heading}
        steps={[
          { icon: "observe", ...t.home.method.steps.observe },
          { icon: "analyze", ...t.home.method.steps.analyze },
          { icon: "quantify", ...t.home.method.steps.quantify },
          { icon: "build", ...t.home.method.steps.build },
        ]}
      />

      <FeaturedResearch
        heading={t.home.featuredResearch.heading}
        title={t.home.featuredResearch.title}
        excerpt={t.home.featuredResearch.excerpt}
        imageLabel={t.home.featuredResearch.imageLabel}
        cta={t.home.featuredResearch.cta}
        href={routes.research}
      />

      <CtaBlock
        heading={t.ctaBlock.heading}
        body={t.ctaBlock.body}
        primary={{ label: t.cta.bookCall, href: routes.contact }}
        phone={{
          label: t.cta.phoneDisplay,
          href: contactDetails.phoneHref,
        }}
        orCallLabel={t.cta.orCall}
      />
    </>
  );
}
