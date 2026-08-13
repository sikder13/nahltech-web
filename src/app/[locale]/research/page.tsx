import { CardGrid, ResearchCard } from "@/components/blocks/cards";
import { HubTemplate } from "@/components/templates/HubTemplate";
import { formatPostDate } from "@/lib/format-date";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { getResearchForHub } from "@/lib/research";
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
    title: t.pages.research.title,
    description: t.pages.research.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  // Methodology first, then engagements newest-first — the ordering lives in
  // the loader so the hub and anything else that lists these agree.
  const articles = getResearchForHub();

  return (
    <HubTemplate
      title={t.pages.research.title}
      intro={t.hubPages.research.intro}
      emptyLabel={t.hub.emptyLabel}
    >
      {articles.length > 0 ? (
        <CardGrid columns={3}>
          {articles.map((article, index) => (
            <ResearchCard
              key={article.slug}
              level={2}
              title={article.title}
              description={article.description}
              href={`${routes.research}/${article.slug}`}
              kindLabel={t.research.kinds[article.kind]}
              meta={formatPostDate(article.date)}
              delay={index * 0.06}
            />
          ))}
        </CardGrid>
      ) : null}
    </HubTemplate>
  );
}
