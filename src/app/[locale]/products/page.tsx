import { CardGrid, ProductCard } from "@/components/blocks/cards";
import { HubTemplate } from "@/components/templates/HubTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { routes } from "@/lib/routes";

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return {
    title: t.pages.products.title,
    description: t.pages.products.description,
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
    <HubTemplate
      title={t.pages.products.title}
      intro={t.hubPages.products.intro}
      emptyLabel={t.hub.emptyLabel}
    >
      <CardGrid columns={2}>
        <ProductCard
          level={2}
          name={t.products.crawlmouse}
          description={t.productSummaries.crawlmouse}
          href={routes.crawlmouse}
          status={t.productStatus.live}
        />
        <ProductCard
          level={2}
          name={t.products.hafsaSastho}
          description={t.productSummaries.hafsaSastho}
          href={routes.hafsaSastho}
          status={t.productStatus.closedBeta}
        />
      </CardGrid>
    </HubTemplate>
  );
}
