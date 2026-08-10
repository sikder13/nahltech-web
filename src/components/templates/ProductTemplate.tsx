import { CtaBlock } from "@/components/blocks/CtaBlock";
import {
  AudienceBlock,
  FeatureGrid,
  ProductHero,
} from "@/components/blocks/product-blocks";
import { contactDetails, routes } from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

export type ProductContent = Dictionary["productPages"]["crawlmouse"];

/** T3 — product page. */
export function ProductTemplate({
  t,
  name,
  status,
  liveUrl,
  content,
}: {
  t: Dictionary;
  name: string;
  status: string;
  liveUrl: string | null;
  content: ProductContent;
}) {
  return (
    <>
      <ProductHero
        name={name}
        tagline={content.tagline}
        status={status}
        liveUrl={liveUrl}
        liveLabel={t.cta.tryItLive}
      />

      <FeatureGrid
        heading={t.product.featuresHeading}
        features={content.features}
      />

      <AudienceBlock
        heading={t.product.audienceHeading}
        items={content.audience}
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
