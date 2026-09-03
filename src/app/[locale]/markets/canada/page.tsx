import { MarketTemplate } from "@/components/templates/MarketTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { routes } from "@/lib/routes";
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
 * TODO — Canada AI funding guide.
 *
 * The approved copy's third bullet under "Practical things Canadian clients
 * ask about" ends on the funding question, and the draft marked the closing
 * clause as a future link to a Canada AI funding guide that does not exist
 * yet. It renders as plain prose until that guide ships; when it does, the
 * link belongs on that sentence and nowhere else, and hard rule 7 means the
 * route has to exist in the registry before the anchor does.
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
      <MarketTemplate t={t} market="marketCanada" content={content} />
    </>
  );
}
