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
    alternates: { canonical: routes.marketNewZealand },
    title: { absolute: t.pages.marketNewZealand.metaTitle },
    description: t.pages.marketNewZealand.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  const content = t.markets.newZealand;
  const breadcrumb = breadcrumbSchema(t, routes.marketNewZealand);
  const faq = dictionaryFaqSchema(content.faq.items);

  return (
    <>
      <JsonLd data={marketServiceSchema(t, "marketNewZealand")} />
      {faq ? <JsonLd data={faq} /> : null}
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      <MarketTemplate t={t} market="marketNewZealand" content={content} />
    </>
  );
}
