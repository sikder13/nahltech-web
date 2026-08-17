import { ProductTemplate } from "@/components/templates/ProductTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { breadcrumbSchema, crawlmouseSchema } from "@/lib/schema-org";

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
    alternates: { canonical: routes.crawlmouse },
    title: { absolute: t.pages.crawlmouse.metaTitle },
    description: t.pages.crawlmouse.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  const breadcrumb = breadcrumbSchema(t, routes.crawlmouse);

  return (
    <>
      <JsonLd data={crawlmouseSchema(t)} />
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      <ProductTemplate
        t={t}
        name={t.productPages.crawlmouse.heading}
        status={t.productStatus.live}
        liveUrl={productLinks.crawlmouse}
        content={t.productPages.crawlmouse}
      />
    </>
  );
}
