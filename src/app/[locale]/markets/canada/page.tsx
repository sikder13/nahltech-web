import { MarketTemplate } from "@/components/templates/MarketTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { canadaFundingGuidePath, routes } from "@/lib/routes";
import {
  breadcrumbSchema,
  dictionaryFaqSchema,
  marketServiceSchema,
} from "@/lib/schema-org";

import { JsonLd } from "@/components/seo/JsonLd";

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return {
    alternates: { canonical: routes.marketCanada },
    title: { absolute: t.pages.marketCanada.metaTitle },
    description: t.pages.marketCanada.description,
  };
}

/**
 * The funding bullet's link, wired now that the guide exists.
 *
 * The approved copy's third bullet under "Practical things Canadian clients
 * ask about" was written with this link in mind and carried a placeholder
 * until `content/blog/ai-funding-canada-small-business.mdx` shipped. The
 * anchor is the founder's — "Canada AI funding guide" — and lives in the
 * dictionary beside the sentence; the destination comes from the route
 * registry, so the two cannot drift apart and `markets.test.ts` checks the
 * slug still resolves to a published post.
 */

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  const content = t.markets.canada;
  const breadcrumb = breadcrumbSchema(t, routes.marketCanada);
  const faq = dictionaryFaqSchema(content.faq.items);

  return (
    <>
      <JsonLd data={marketServiceSchema(t, "marketCanada")} />
      {faq ? <JsonLd data={faq} /> : null}
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      <MarketTemplate
        t={t}
        market="marketCanada"
        content={content}
        trailingLinkHref={canadaFundingGuidePath}
      />
    </>
  );
}
