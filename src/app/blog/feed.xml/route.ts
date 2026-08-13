import { getPublishedPosts } from "@/lib/blog";
import { getPublishedResearch } from "@/lib/research";
import { routes, siteUrl } from "@/lib/routes";

import en from "@/lib/i18n/dictionaries/en.json";

/**
 * RSS 2.0 feed for the blog.
 *
 * Lives outside the `[locale]` segment, alongside sitemap.ts and robots.ts.
 * The middleware matcher skips paths containing a dot, so `/blog/feed.xml` is
 * never rewritten under a locale — putting it inside `[locale]` would make it
 * unreachable.
 *
 * English only, matching the sitemap: `ar` and `bn` are configured but have no
 * content, and a feed advertising empty locales is worse than no feed.
 */

export const dynamic = "force-static";

/** XML has five predefined entities; everything else in the text must escape. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * One entry, from either collection.
 *
 * Research artifacts publish into the same feed rather than a second one: a
 * reader subscribing to "what Nahl publishes" wants the engagement
 * walkthroughs at least as much as the posts, and two feeds would make them
 * choose. `category` carries the blog's cluster or the artifact's kind, so a
 * subscriber can still tell them apart.
 */
type FeedEntry = {
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  path: string;
};

export function GET(): Response {
  const entries: FeedEntry[] = [
    ...getPublishedResearch().map((article) => ({
      title: article.title,
      description: article.description,
      date: article.date,
      author: article.author,
      category: article.kind,
      path: `${routes.research}/${article.slug}`,
    })),
    ...getPublishedPosts().map((post) => ({
      title: post.title,
      description: post.description,
      date: post.date,
      author: post.author,
      category: post.cluster,
      path: `${routes.blog}/${post.slug}`,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const self = new URL("/blog/feed.xml", siteUrl).toString();
  const blogUrl = new URL(routes.blog, siteUrl).toString();

  const items = entries
    .map((entry) => {
      const url = new URL(entry.path, siteUrl).toString();
      return `    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(entry.description)}</description>
      <pubDate>${new Date(`${entry.date}T00:00:00Z`).toUTCString()}</pubDate>
      <author>${escapeXml(entry.author)}</author>
      <category>${escapeXml(entry.category)}</category>
    </item>`;
    })
    .join("\n");

  const lastBuild = entries[0]
    ? new Date(`${entries[0].date}T00:00:00Z`).toUTCString()
    : new Date(0).toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${en.site.name} — ${en.pages.blog.title}`)}</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>${escapeXml(en.hubPages.blog.intro)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
