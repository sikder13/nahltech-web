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
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return allRoutePaths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified,
    changeFrequency: path === routes.home ? "weekly" : "monthly",
    priority: path === routes.home ? 1 : 0.7,
  }));
}
