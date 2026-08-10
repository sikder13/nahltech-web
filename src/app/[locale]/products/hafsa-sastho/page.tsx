import { ProductTemplate } from "@/components/templates/ProductTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { productLinks } from "@/lib/routes";

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return {
    title: { absolute: t.pages.hafsaSastho.metaTitle },
    description: t.pages.hafsaSastho.description,
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
    <ProductTemplate
      t={t}
      name={t.productPages.hafsaSastho.heading}
      status={t.productStatus.closedBeta}
      liveUrl={productLinks.hafsaSastho}
      content={t.productPages.hafsaSastho}
    />
  );
}
