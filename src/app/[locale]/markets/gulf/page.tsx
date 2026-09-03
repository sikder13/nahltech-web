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
    alternates: { canonical: routes.marketGulf },
    title: { absolute: t.pages.marketGulf.metaTitle },
    description: t.pages.marketGulf.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  const content = t.markets.gulf;
  const breadcrumb = breadcrumbSchema(t, routes.marketGulf);
  const faq = dictionaryFaqSchema(content.faq.items);

  return (
    <>
      <JsonLd data={marketServiceSchema(t, "marketGulf")} />
      {faq ? <JsonLd data={faq} /> : null}
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      <MarketTemplate t={t} market="marketGulf" content={content} />
    </>
  );
}
