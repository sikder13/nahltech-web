import { MarketTemplate } from "@/components/templates/MarketTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { nzGuidePaths, routes } from "@/lib/routes";
import {
  breadcrumbSchema,
  dictionaryFaqSchema,
  nzTourismServiceSchema,
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
    alternates: { canonical: routes.nzTourism },
    title: { absolute: t.pages.nzTourism.metaTitle },
    description: t.pages.nzTourism.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  // The closing block is the site's own booking CTA, heading and button
  // label included; only the line under the heading belongs to this page.
  const content = {
    ...t.nzTourism,
    cta: {
      heading: t.ctaBlock.heading,
      body: t.nzTourism.cta.body,
      primaryLabel: t.cta.bookCall,
    },
  };
  const breadcrumb = breadcrumbSchema(t, routes.nzTourism);
  const faq = dictionaryFaqSchema(content.faq.items);

  return (
    <>
      <JsonLd data={nzTourismServiceSchema(t)} />
      {faq ? <JsonLd data={faq} /> : null}
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      <MarketTemplate
        t={t}
        market="nzTourism"
        content={content}
        hrefs={nzGuidePaths}
      />
    </>
  );
}
