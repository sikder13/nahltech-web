import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Security headers that must reach *every* response, including static assets.
 *
 * The middleware already sets these, and deliberately keeps doing so — but its
 * matcher excludes `_next/static` and anything with a file extension, because
 * those must not go through the locale rewrite. The consequence was that every
 * JavaScript and CSS file shipped without `nosniff`. Headers declared here are
 * applied by the platform to all routes, so the two layers overlap on pages
 * and API routes and only this one covers the bundles.
 *
 * The Content-Security-Policy is NOT duplicated here. It is assembled per
 * request in the middleware from the Supabase origin and whether analytics is
 * configured, which static config cannot do — and a second, staler CSP on the
 * same response would be worse than none.
 */
const BASELINE_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  ...(isProduction
    ? [
        {
          // No `preload` — see the note in src/middleware.ts. The two values
          // must stay identical; they are asserted together in the tests.
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: BASELINE_SECURITY_HEADERS }];
  },

  /**
   * Legacy URL map.
   *
   * `permanent: true` emits 308, not 301. The two are equivalent for search
   * engines — both are permanent and both pass authority — and 308 additionally
   * preserves the request method. This matches the redirect that was already
   * here rather than mixing two status codes for the same job.
   *
   * These run before middleware, so a legacy path is redirected before the
   * locale rewrite ever sees it.
   */
  async redirects() {
    return [
      {
        // Local SEO folded into AI Search Visibility & SEO. Permanent, so the
        // old URL's authority transfers rather than being dropped.
        source: "/services/local-seo",
        destination: "/services/ai-search-visibility",
        permanent: true,
      },
      // The old site used a singular /product hub.
      {
        source: "/product",
        destination: "/products",
        permanent: true,
      },
      {
        source: "/product/hafsa-sastho",
        destination: "/products/hafsa-sastho",
        permanent: true,
      },
      {
        // "Shastho" is a common misspelling of the product name, which is
        // Hafsa Sastho (হাফসা স্বাস্থ্য). It is caught here and nowhere else:
        // no rendered surface on this site uses that spelling.
        source: "/product/hafsa-shastho",
        destination: "/products/hafsa-sastho",
        permanent: true,
      },
      {
        // The old beta landing page, before the product had a hub entry.
        source: "/hafsa-sastho/beta",
        destination: "/products/hafsa-sastho",
        permanent: true,
      },
      {
        source: "/about/team",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/privacy",
        destination: "/legal/privacy",
        permanent: true,
      },
      /**
       * Two brand posts unpublished 13 Aug 2026. They were live URLs, so
       * they redirect rather than 404 — `draft: true` alone would take them
       * out of the hub, feed and sitemap while leaving anyone holding the
       * old link, or any engine still carrying it, at a dead end.
       *
       * /about is the honest destination: both were about who we are and why
       * we started, which is what that page covers.
       */
      {
        source: "/blog/two-immigrants-one-mission-why-we-are-building-for-home",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/blog/why-we-named-our-company-after-the-honeybee",
        destination: "/about",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
