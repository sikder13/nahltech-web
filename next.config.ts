import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
