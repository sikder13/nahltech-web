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
  /**
   * Local landing page for the Indianapolis market.
   *
   * Deliberately *not* a sixth service. `serviceRouteKeys` stays five, the
   * nav gains nothing, `knowsAbout` gains nothing, and no service grid
   * derives a card from it — it sells the same engagement
   * `/services/ai-consultancy` sells, to the visitor who searched for it by
   * city. It sits at the root rather than under `/services` because that is
   * the URL the copy was approved against, and because a city page nested
   * under a service reads as a variant of that service rather than an
   * entry point of its own.
   */
  aiConsultingIndianapolis: "/ai-consulting-indianapolis",
  /**
   * Market landing pages — one per territory the canonical descriptor names.
   *
   * Same reasoning as the Indianapolis page and the same limits: not
   * services, so `serviceRouteKeys` stays five and `knowsAbout` gains
   * nothing. Each sells the engagement `/services/ai-consultancy` sells, to
   * a visitor who searched from a place rather than for a capability.
   *
   * **There is no `/markets` hub route, deliberately.** Nothing links to that
   * path, `breadcrumbSchema` skips a segment it cannot resolve, and adding
   * one would be a page with no approved copy on it. The four leaves are the
   * whole feature.
   */
  marketCanada: "/markets/canada",
  marketGulf: "/markets/gulf",
  marketCentralAsia: "/markets/central-asia",
  marketNewZealand: "/markets/new-zealand",
  /**
   * Industry landing page for manufacturers.
   *
   * The same limits as the city and market pages, for the same reason: not a
   * service, so `serviceRouteKeys` stays five, the nav gains nothing and
   * `knowsAbout` gains nothing. It sells the engagement the service pages
   * sell, to a visitor who arrived by industry rather than by capability or
   * place. At the root, like `/ai-consulting-indianapolis`, because that is
   * the URL the copy was approved against.
   */
  manufacturing: "/manufacturing",
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
 * The four markets, in the order the canonical descriptor names them:
 * North America, the Gulf, Central Asia, New Zealand.
 *
 * Read by the markets sentence, the sitemap and the tests, so the order a
 * visitor meets them in is the order the identity phrase already uses. A
 * fifth market is a route, a dictionary slice and an entry here.
 */
export const marketRouteKeys = [
  "marketCanada",
  "marketGulf",
  "marketCentralAsia",
  "marketNewZealand",
] as const satisfies readonly RouteKey[];

export type MarketKey = (typeof marketRouteKeys)[number];

/**
 * Route key → the slice under `markets` in the dictionary.
 *
 * Written out rather than derived from the route key by string surgery: a
 * mapping that a human can read wrong is better than one a rename can break
 * silently, and `markets.test.ts` checks both sides still exist.
 */
export const marketDictionaryKeys = {
  marketCanada: "canada",
  marketGulf: "gulf",
  marketCentralAsia: "centralAsia",
  marketNewZealand: "newZealand",
} as const satisfies Record<MarketKey, string>;

/**
 * The data report the home page's proof line cites by its numbers.
 *
 * Pinned to this artifact rather than to the research hub, and deliberately
 * not to "whatever is featured": the proof line quotes a figure that belongs
 * to this document, so the link has to land on the document that carries it.
 * A visitor who taps a number should arrive at the number.
 *
 * `home-proof.test.ts` checks the slug resolves to a published artifact and
 * that the figure still matches what the artifact says.
 */
/**
 * The generated site-wide OG image, as a URL.
 *
 * Emitted by `app/opengraph-image.tsx` — the file convention CLAUDE.md
 * requires, not a static asset. It is named here because the article routes
 * have to reference it explicitly: a page that declares its own `openGraph`
 * object stops inheriting the convention's image, and every article does
 * declare one to carry `type: article`, `publishedTime` and `authors`. Left
 * alone, those pages share with no image at all and a small `summary` card.
 *
 * Per-post images remain a separate piece of work; this is the site default
 * standing in until they exist, which is strictly better than nothing.
 */
export const ogImagePath = "/opengraph-image";

export const datasetReportSlug = "crawlmouse-dataset-report";
export const datasetReportPath = `${routes.research}/${datasetReportSlug}`;

/**
 * The Canada funding guide, named here because `/markets/canada` links it.
 *
 * Blog posts are not routes in this registry — they are files, resolved by
 * slug — so a component linking one has nothing to derive an href from and
 * hard rule 7 has nothing to check. Naming the slug in one place gives the
 * link a single source and gives `markets.test.ts` something to assert
 * against the published collection, which is the same arrangement
 * `datasetReportSlug` has for the home page's proof line.
 */
export const canadaFundingGuideSlug = "ai-funding-canada-small-business";
export const canadaFundingGuidePath = `${routes.blog}/${canadaFundingGuideSlug}`;

/**
 * The Gulf website study, named here because `/markets/gulf` links it.
 *
 * Same reasoning as the funding guide above: research artifacts are files
 * resolved by slug rather than routes, so a component linking one needs a
 * single source and a test that the slug still resolves.
 */
export const gulfStudySlug = "gulf-smb-websites-ai-search-study";
export const gulfStudyPath = `${routes.research}/${gulfStudySlug}`;

/**
 * The four manufacturing pieces `/manufacturing` links, in the order its
 * approved copy lists them.
 *
 * Same arrangement as the two constants above, for four links at once: two
 * research engagements and two blog posts, each a file resolved by slug
 * rather than a route, so the page needs one place to take each href from
 * and `manufacturing.test.ts` needs one place to check each still resolves
 * to a published document. The keys match `manufacturing.work.items` in the
 * dictionary, which is how each anchor finds its destination.
 */
export const manufacturingPiecePaths = {
  quoting: `${routes.research}/sample-engagement-indiana-machine-shop-quoting`,
  proposals: `${routes.research}/sample-engagement-ontario-machine-builder-proposals`,
  iso13485: `${routes.blog}/iso-13485-documentation-ai`,
  scrap: `${routes.blog}/ai-injection-molding-scrap-reduction`,
} as const;

export type ManufacturingPieceKey = keyof typeof manufacturingPiecePaths;

/**
 * The Indiana Manufacturing Readiness Grants guide, named here because
 * `/manufacturing` links it from its grants paragraph.
 *
 * Kept apart from `manufacturingPiecePaths`, which the page renders as its
 * list of worked engagements: this is a funding guide cited mid-paragraph,
 * the Indiana counterpart of `canadaFundingGuidePath` beside it.
 * `manufacturing.test.ts` checks the slug still resolves to a published post.
 */
export const indianaGrantsGuideSlug = "manufacturing-readiness-grants-indiana";
export const indianaGrantsGuidePath = `${routes.blog}/${indianaGrantsGuideSlug}`;

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
  // The apex is canonical: `www.crawlmouse.com` 308s to this, so linking the
  // www form spends a redirect hop on every link on the site for nothing.
  crawlmouse: "https://crawlmouse.com",
  // Closed beta: no public URL.
  hafsaSastho: null,
} as const;

/**
 * Company social profiles, in the order the footer renders them.
 *
 * These are the company's own accounts. A personal profile — the founder's
 * LinkedIn — is not one of these: it belongs to the Person entity in the
 * author registry, not to the company. Mixing the two tells a search engine
 * the organisation and the individual are the same thing.
 *
 * GitHub is the deliberate edge case, added on the founder's decision. The
 * account is named for a person, but what lives in it is the company's public
 * code — this site among it — so it is the company's code presence rather
 * than a profile describing an individual. That is the line: a personal
 * LinkedIn is a page *about* Udaay, and this is a page *of* the firm's work.
 * If the account is ever renamed to an organisation, nothing here changes but
 * the URL.
 *
 * The LinkedIn URL carries no `?viewAsMember=true`: that parameter is an
 * artefact of viewing your own page while signed in, not part of the public
 * address.
 */
export const socialLinks = [
  { key: "x", href: "https://x.com/nahltech" },
  {
    key: "linkedin",
    href: "https://www.linkedin.com/company/nahl-technologies-incorporation-linkedin/",
  },
  {
    key: "facebook",
    href: "https://www.facebook.com/profile.php?id=61589050512455",
  },
  { key: "github", href: "https://github.com/sikder13" },
] as const;

export type SocialKey = (typeof socialLinks)[number]["key"];

/**
 * Every profile the company controls — the exact `sameAs` set emitted on
 * Organization. Built from the same constants the footer renders, so the
 * markup cannot claim a profile the site does not link to, or miss one it does.
 */
export const companyProfiles: readonly string[] = [
  productLinks.crawlmouse,
  ...socialLinks.map((link) => link.href),
];

/**
 * Instant booking.
 *
 * Typed as nullable on purpose. The site has to keep working if the booking
 * page is ever retired, and the guards that behaviour depends on only stay
 * honest if the type admits null (hard rule 7, same shape as `productLinks`).
 */
export const bookingUrl: string | null =
  "https://cal.com/udaay-nahltech/intro-call-15-min";

/**
 * Where every "Book a call" control points.
 *
 * One resolved target rather than a null check at each of the eight call
 * sites: booking when we have it, the contact page when we do not. Off-site
 * links get the external treatment — new tab plus rel hardening — matching
 * how the Crawlmouse links are handled.
 */
export const bookingCta: { href: string; external: boolean } = bookingUrl
  ? { href: bookingUrl, external: true }
  : { href: routes.contact, external: false };
