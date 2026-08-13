import { PricingTemplate } from "@/components/templates/UtilityTemplates";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { offerCatalogSchema } from "@/lib/schema-org";

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
    title: { absolute: t.pages.pricing.metaTitle },
    description: t.pages.pricing.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return (
    <>
      <JsonLd data={offerCatalogSchema(t)} />
      <PricingTemplate t={t} />
    </>
  );
}
