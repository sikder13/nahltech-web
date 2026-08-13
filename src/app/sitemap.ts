import { getPublishedPosts } from "@/lib/blog";
import { getPublishedResearch } from "@/lib/research";
import { allRoutePaths, routes, siteUrl } from "@/lib/routes";

import type { MetadataRoute } from "next";

/**
 * English only. `ar` and `bn` are configured but not live, and listing a
 * locale with no content — or emitting hreflang at it — is an SEO error
 * (ARCH-1 §8). When a locale ships, it enters `liveLocales` and this reads
 * from there.
 *
 * Entries come from the same route registry the header and footer use, so a
 * page cannot exist without being listed, or be listed without existing.
 * Blog posts come from the same loader the pages render from, for the same
 * reason.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const generatedAt = new Date();

  const pages: MetadataRoute.Sitemap = allRoutePaths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: generatedAt,
    changeFrequency: path === routes.home ? "weekly" : "monthly",
    priority: path === routes.home ? 1 : 0.7,
  }));

  // Posts carry their own date: a post's lastmod is when it was published,
  // not when the site last deployed. Claiming otherwise tells a crawler every
  // post changed on every build.
  const posts: MetadataRoute.Sitemap = getPublishedPosts().map((post) => ({
    url: new URL(`${routes.blog}/${post.slug}`, siteUrl).toString(),
    lastModified: new Date(`${post.date}T00:00:00Z`),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  // Research artifacts rank above posts: they are the long-form documents the
  // service pages point at, and the ones a prospect is sent to read.
  const research: MetadataRoute.Sitemap = getPublishedResearch().map(
    (article) => ({
      url: new URL(`${routes.research}/${article.slug}`, siteUrl).toString(),
      lastModified: new Date(`${article.date}T00:00:00Z`),
      changeFrequency: "yearly",
      priority: 0.7,
    }),
  );

  return [...pages, ...research, ...posts];
}
