/**
 * Every route the site serves, in one place.
 *
 * The header, footer, sitemap and 404 all build their links from here, so a
 * link can only exist if the route does. Adding a page means adding it here
 * and creating the file — nothing can silently point at a 404.
 *
 * Paths are locale-agnostic: English ships unprefixed and the middleware
 * rewrites to /en internally.
 */
export const routes = {
  home: "/",
  services: "/services",
  // Canonical service order — nav, footer, grids and the sitemap all read it
  // from here so they cannot drift apart.
  aiConsultancy: "/services/ai-consultancy",
  aiSearchVisibility: "/services/ai-search-visibility",
  aiAutomation: "/services/ai-automation",
  webDevelopment: "/services/web-development",
  softwareDevelopment: "/services/software-development",
  products: "/products",
  crawlmouse: "/products/crawlmouse",
  hafsaSastho: "/products/hafsa-sastho",
  pricing: "/pricing",
  research: "/research",
  blog: "/blog",
  about: "/about",
  contact: "/contact",
  privacy: "/legal/privacy",
  terms: "/legal/terms",
  dpa: "/legal/dpa",
} as const;

export type RouteKey = keyof typeof routes;
export type RoutePath = (typeof routes)[RouteKey];

export const allRoutePaths: readonly RoutePath[] = Object.values(routes);

/** The five services, in the order they appear everywhere on the site. */
export const serviceRouteKeys = [
  "aiConsultancy",
  "aiSearchVisibility",
  "aiAutomation",
  "webDevelopment",
  "softwareDevelopment",
] as const satisfies readonly RouteKey[];

export type ServiceKey = (typeof serviceRouteKeys)[number];

/**
 * NAP details. These must match the Google Business Profile exactly — see
 * ARCH-1 §7, where LocalBusiness JSON-LD is generated from the same values.
 */
export const contactDetails = {
  phoneDisplay: "(317) 507-4303",
  phoneHref: "tel:+13175074303",
  email: "info@nahltech.com",
  emailHref: "mailto:info@nahltech.com",
  street: "6902 Challenge Ln",
  locality: "Indianapolis",
  region: "IN",
  postalCode: "46250",
  country: "US",
} as const;

export const siteUrl = "https://nahltech.com";

/**
 * Public URLs for our own products. `null` means there is nothing to link to
 * yet, and the "Try it live" button is omitted rather than pointed at a guess
 * — hard rule 7, every href resolves.
 */
export const productLinks = {
  crawlmouse: "https://crawlmouse.com",
  // Closed beta: no public URL.
  hafsaSastho: null,
} as const;
