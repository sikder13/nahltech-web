import { ProductTemplate } from "@/components/templates/ProductTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { breadcrumbSchema, hafsaSasthoSchema } from "@/lib/schema-org";

import { JsonLd } from "@/components/seo/JsonLd";
import { productLinks, routes } from "@/lib/routes";

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

  const breadcrumb = breadcrumbSchema(t, routes.hafsaSastho);

  return (
    <>
      <JsonLd data={hafsaSasthoSchema(t)} />
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      <ProductTemplate
        t={t}
        name={t.productPages.hafsaSastho.heading}
        status={t.productStatus.closedBeta}
        liveUrl={productLinks.hafsaSastho}
        content={t.productPages.hafsaSastho}
      />
    </>
  );
}
