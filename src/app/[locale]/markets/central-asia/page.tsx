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
    alternates: { canonical: routes.marketCentralAsia },
    title: { absolute: t.pages.marketCentralAsia.metaTitle },
    description: t.pages.marketCentralAsia.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  const content = t.markets.centralAsia;
  const breadcrumb = breadcrumbSchema(t, routes.marketCentralAsia);
  const faq = dictionaryFaqSchema(content.faq.items);

  return (
    <>
      <JsonLd data={marketServiceSchema(t, "marketCentralAsia")} />
      {faq ? <JsonLd data={faq} /> : null}
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      <MarketTemplate t={t} market="marketCentralAsia" content={content} />
    </>
  );
}
