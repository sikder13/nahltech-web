import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Local SEO folded into AI Search Visibility & SEO. Permanent, so the
        // old URL's authority transfers rather than being dropped.
        source: "/services/local-seo",
        destination: "/services/ai-search-visibility",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
