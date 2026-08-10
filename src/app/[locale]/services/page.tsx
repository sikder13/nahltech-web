import { CardGrid, ServiceCard } from "@/components/blocks/cards";
import { HubTemplate } from "@/components/templates/HubTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { serviceIcons } from "@/lib/service-icons";
import { routes, serviceRouteKeys } from "@/lib/routes";

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
      {/* Three then two at lg — five in a four-column grid would orphan one. */}
      <CardGrid columns={3}>
        {serviceRouteKeys.map((key, index) => (
          <ServiceCard
            key={key}
            title={t.services[key]}
            description={t.serviceSummaries[key]}
            href={routes[key]}
            icon={serviceIcons[key]}
            delay={index * 0.06}
          />
        ))}
      </CardGrid>
    </HubTemplate>
  );
}
