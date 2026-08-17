import { CardGrid, ArticleCard } from "@/components/blocks/cards";
import { HubTemplate } from "@/components/templates/HubTemplate";
import { getPublishedPosts } from "@/lib/blog";
import { formatPostDate } from "@/lib/format-date";
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
    alternates: { canonical: routes.blog },
    title: t.pages.blog.title,
    description: t.pages.blog.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  const posts = getPublishedPosts();

  return (
    <HubTemplate
      title={t.pages.blog.title}
      intro={t.hubPages.blog.intro}
      emptyLabel={t.hub.emptyLabel}
    >
      {posts.length > 0 ? (
        <CardGrid>
          {posts.map((post, index) => (
            <ArticleCard
              key={post.slug}
              level={2}
              title={post.title}
              excerpt={post.description}
              href={`/blog/${post.slug}`}
              meta={formatPostDate(post.date)}
              imageLabel={post.title}
              delay={index * 0.06}
            />
          ))}
        </CardGrid>
      ) : null}
    </HubTemplate>
  );
}
