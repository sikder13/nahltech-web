import { getPublishedPosts } from "@/lib/blog";
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

export function GET(): Response {
  const posts = getPublishedPosts();
  const self = new URL("/blog/feed.xml", siteUrl).toString();
  const blogUrl = new URL(routes.blog, siteUrl).toString();

  const items = posts
    .map((post) => {
      const url = new URL(`${routes.blog}/${post.slug}`, siteUrl).toString();
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <author>${escapeXml(post.author)}</author>
      <category>${escapeXml(post.cluster)}</category>
    </item>`;
    })
    .join("\n");

  const lastBuild = posts[0]
    ? new Date(`${posts[0].date}T00:00:00Z`).toUTCString()
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
