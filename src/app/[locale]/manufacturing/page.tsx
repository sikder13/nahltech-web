import { IndustryLandingTemplate } from "@/components/templates/IndustryLandingTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { routes } from "@/lib/routes";
import {
  breadcrumbSchema,
  dictionaryFaqSchema,
  manufacturingServiceSchema,
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
    alternates: { canonical: routes.manufacturing },
    title: { absolute: t.pages.manufacturing.metaTitle },
    description: t.pages.manufacturing.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  const content = t.manufacturing;
  const breadcrumb = breadcrumbSchema(t, routes.manufacturing);
  const faq = dictionaryFaqSchema(content.faq.items);

  return (
    <>
      <JsonLd data={manufacturingServiceSchema(t)} />
      {faq ? <JsonLd data={faq} /> : null}
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      <IndustryLandingTemplate t={t} content={content} />
    </>
  );
}
