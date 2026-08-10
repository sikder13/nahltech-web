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

  return { title: t.pages.crawlmouse.title };
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
      name={t.pages.crawlmouse.title}
      status={t.productStatus.live}
      liveUrl={productLinks.crawlmouse}
      content={t.productPages.crawlmouse}
    />
  );
}
