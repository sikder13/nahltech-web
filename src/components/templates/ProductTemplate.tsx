import { CtaBlock } from "@/components/blocks/CtaBlock";
import {
  AudienceBlock,
  FeatureGrid,
  ProductHero,
} from "@/components/blocks/product-blocks";
import { LinkedText } from "@/components/ui/LinkedText";
import { bookingCta, contactDetails } from "@/lib/routes";

import type { TextSegment } from "@/components/ui/LinkedText";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * A product page's copy. `evidence` is optional because only Crawlmouse has
 * approved copy for it: the line naming the study it was the instrument for.
 */
export type ProductContent = Omit<
  Dictionary["productPages"]["crawlmouse"],
  "evidence"
> & { evidence?: readonly TextSegment[] };

/** T3 — product page. */
export function ProductTemplate({
  t,
  name,
  status,
  liveUrl,
  content,
  hrefs,
}: {
  t: Dictionary;
  name: string;
  status: string;
  liveUrl: string | null;
  content: ProductContent;
  /** Destinations for the `evidence` line's links, by segment key. */
  hrefs?: Readonly<Record<string, string>>;
}) {
  return (
    <>
      <ProductHero
        name={name}
        tagline={content.tagline}
        status={status}
        liveUrl={liveUrl}
        liveLabel={t.cta.tryItLive}
        evidence={
          content.evidence ? (
            <LinkedText segments={content.evidence} hrefs={hrefs} />
          ) : undefined
        }
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
