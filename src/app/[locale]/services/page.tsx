import { CardGrid, ServiceCard } from "@/components/blocks/cards";
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

  return { title: t.pages.services.title };
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
      title={t.pages.services.title}
      intro={t.hubPages.services.intro}
      emptyLabel={t.hub.emptyLabel}
    >
      <CardGrid columns={4}>
        <ServiceCard
          title={t.services.aiSearchVisibility}
          description={t.serviceSummaries.aiSearchVisibility}
          href={routes.aiSearchVisibility}
          icon="sparkle"
        />
        <ServiceCard
          title={t.services.localSeo}
          description={t.serviceSummaries.localSeo}
          href={routes.localSeo}
          icon="pin"
        />
        <ServiceCard
          title={t.services.webDevelopment}
          description={t.serviceSummaries.webDevelopment}
          href={routes.webDevelopment}
          icon="build"
        />
        <ServiceCard
          title={t.services.aiAutomation}
          description={t.serviceSummaries.aiAutomation}
          href={routes.aiAutomation}
          icon="method"
        />
      </CardGrid>
    </HubTemplate>
  );
}
