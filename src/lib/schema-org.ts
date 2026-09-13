import { getAuthor } from "@/lib/authors";
import { localPricingRows } from "@/lib/pricing-mirror";
import {
  companyProfiles,
  contactDetails,
  productLinks,
  routes,
  siteUrl,
  type MarketKey,
  type RouteKey,
  type ServiceKey,
} from "@/lib/routes";

import type { Post } from "@/lib/blog";
import type { FaqEntry } from "@/lib/mdx";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * JSON-LD builders (ARCH-1 §7).
 *
 * Everything here is derived from the same values the page renders, never
 * written twice. Structured data that restates the visible content by hand is
 * structured data that will eventually contradict it, and a contradiction is
 * worse than an absence: it is a claim to a search engine that the page does
 * not support.
 *
 * The site emits no `aggregateRating` anywhere, on any type, ever. We have no
 * review corpus to aggregate, and a rating we cannot substantiate is the one
 * piece of structured data that is both trivially faked and specifically
 * penalised.
 */

export type JsonLdObject = Record<string, unknown>;

/**
 * Stable node identities.
 *
 * Organization, WebSite and LocalBusiness are emitted on every page. Giving
 * them `@id`s means the graph describes one company referenced many times
 * rather than N companies that happen to share a name — and lets Article's
 * publisher and Service's provider point at the root node instead of restating
 * it, which is how the two would eventually drift apart.
 */
const ORGANIZATION_ID = `${siteUrl}/#organization`;
const WEBSITE_ID = `${siteUrl}/#website`;
const LOCAL_BUSINESS_ID = `${siteUrl}/#localbusiness`;

/**
 * Where we sell — places, not prose. One constant for every node that makes
 * the claim: Organization, LocalBusiness, all five Services, and the
 * manufacturers page's Service.
 *
 * Every region the descriptor names is spelled out country by country,
 * because `areaServed` takes places and "the Gulf region" is not one: a
 * consumer resolves AE, it cannot resolve a phrase. ISO 3166-1 alpha-2
 * throughout, so the ten are one kind of value rather than a mix of codes and
 * long names.
 *
 * These ten are the machine-readable half of the canonical descriptor, and
 * nothing here goes beyond what that descriptor says out loud. The order is
 * the descriptor's order: North America (US, CA), the Gulf (AE, SA, QA, KW,
 * BH, OM), Central Asia (KZ), New Zealand (NZ).
 *
 * Central Asia is one country here and a region in the sentence, and that
 * asymmetry is deliberate. The GTM expansion named Kazakhstan; the other four
 * Central Asian states were not named and are not sold into, so claiming them
 * as places would be the machine half saying more than the firm does. The
 * narrower list is the defensible one — widen it when a country is actually
 * added, not when the phrase sounds broader.
 *
 * The Service nodes used to carry `[{City: Indianapolis}, "Worldwide"]`
 * instead. "Worldwide" was not false, but a firm that sells into ten named
 * countries and offers its services worldwide is two claims, and the graph
 * only gets to make one.
 *
 * ── The one exception, approved 24 August 2026 ────────────────────────────
 *
 * City nodes were removed site-wide so the graph makes one claim.
 * /ai-consulting-indianapolis is the deliberate exception: its subject is the
 * local footprint, and its areaServed mirrors the GBP service-area list 1:1.
 * Do not add City objects anywhere else.
 *
 * The exception is scoped, not a reversal. This constant is untouched and
 * still shared: Organization, LocalBusiness and all five `serviceSchema`
 * nodes carry these ten countries. Only `localServiceSchema` differs, and
 * its list is defined beside it — deliberately not in here, so that widening
 * the city footprint cannot reach any other node by accident.
 * `schema-org.test.ts` asserts City appears on that node and on no other.
 */
const AREA_SERVED: readonly unknown[] = [
  { "@type": "Country", name: "US" },
  { "@type": "Country", name: "CA" },
  { "@type": "Country", name: "AE" },
  { "@type": "Country", name: "SA" },
  { "@type": "Country", name: "QA" },
  { "@type": "Country", name: "KW" },
  { "@type": "Country", name: "BH" },
  { "@type": "Country", name: "OM" },
  { "@type": "Country", name: "KZ" },
  { "@type": "Country", name: "NZ" },
];

/**
 * `knowsAbout` — the five subjects the firm claims competence in, one per
 * service page. Each is backed by a page that sells that work, which is the
 * only reason any of them is defensible; a sixth subject would need a sixth
 * page before it could go here.
 *
 * Not derived from the service dictionary on purpose. These are vocabulary
 * terms a model matches against, not the headings a reader sees, and the two
 * are allowed to differ.
 *
 * No `slogan` sits beside them: none is approved, and inventing one would be
 * a product claim (hard rule 12).
 */
const KNOWS_ABOUT: readonly string[] = [
  "AI consulting",
  "AI workflow automation",
  "custom software development",
  "web development",
  "AI search visibility",
];

const organization = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Nahl Technologies",
  url: siteUrl,
} as const;

/** Absolute URL for a site-relative path. */
function absolute(path: string): string {
  return new URL(path, siteUrl).toString();
}

/**
 * Reads a published price out of a copy string like `"from $2,500"`.
 *
 * Returns null unless the string carries exactly one unambiguous amount. A
 * range (`"$15,000–$45,000"`) and the word `"custom"` both yield null, so the
 * Offer ships without a `price` rather than with one end of a range presented
 * as the price. That is the whole point: the markup can only ever say what the
 * page already says.
 */
export function parsePublishedPrice(amount: string): number | null {
  const matches = amount.match(/\$[\d,]+(?:\.\d+)?/g);
  if (!matches || matches.length !== 1) return null;

  const value = Number(matches[0].slice(1).replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

/** True when the published unit describes a recurring monthly charge. */
function isMonthly(unit: string): boolean {
  return /month|\/mo\b/i.test(unit);
}

/**
 * An Offer built from published copy.
 *
 * A monthly retainer carries a `UnitPriceSpecification` with an explicit
 * billing period. Without it, `price: 2500` on a $2,500/month engagement reads
 * as a one-off fee — the markup would understate the price by an order of
 * magnitude over a year, which is exactly the sort of contradiction the module
 * comment above is about.
 */
function offer(url: string, price: number | null, unit: string): JsonLdObject {
  if (price === null) {
    return { "@type": "Offer", url, priceCurrency: "USD" };
  }

  return {
    "@type": "Offer",
    url,
    priceCurrency: "USD",
    price,
    ...(isMonthly(unit)
      ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceCurrency: "USD",
            price,
            billingDuration: 1,
            billingIncrement: 1,
            unitCode: "MON",
          },
        }
      : {}),
  };
}

/**
 * Person for a byline, built from the author registry.
 *
 * Every optional field is omitted when we have not been given it, rather than
 * filled with a plausible default. An empty `jobTitle` says nothing; a guessed
 * one says something false.
 */
export function personSchema(name: string): JsonLdObject {
  const author = getAuthor(name);
  if (!author) return { "@type": "Person", name };

  return {
    "@type": "Person",
    name: author.name,
    ...(author.jobTitle ? { jobTitle: author.jobTitle } : {}),
    ...(author.url ? { url: new URL(author.url, siteUrl).toString() } : {}),
    ...(author.sameAs ? { sameAs: author.sameAs } : {}),
    worksFor: {
      "@type": "Organization",
      name: "Nahl Technologies Inc.",
      url: siteUrl,
    },
  };
}

export function articleSchema(post: Post): JsonLdObject {
  const url = new URL(`${routes.blog}/${post.slug}`, siteUrl).toString();

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    // Full ISO 8601 with an explicit offset. A bare `YYYY-MM-DD` is a valid
    // schema.org Date, but Google's Rich Results Test reports it as an invalid
    // datetime missing a timezone, and a date with no offset is genuinely
    // ambiguous about which day it names.
    datePublished: `${post.date}T00:00:00+00:00`,
    // Present only when the post has been revised, and read from the same
    // `updatedAt` the sitemap emits as `lastmod` — one field, two surfaces,
    // so the graph and the sitemap cannot tell a crawler different stories
    // about when this document last changed. Omitted rather than defaulted to
    // `datePublished`: a `dateModified` equal to publication says an edit
    // happened when none did, and on a page revised monthly that is the
    // claim most worth getting right.
    ...(post.updatedAt
      ? { dateModified: `${post.updatedAt}T00:00:00+00:00` }
      : {}),
    author: personSchema(post.author),
    publisher: organization,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
}

/**
 * Article for a research artifact.
 *
 * Deliberately the same shape as a blog post's, with one hard constraint that
 * is the whole reason this is a separate builder: **the three sample
 * engagements describe fictional companies.** Nothing here may emit an
 * Organization node for Redbud, Kestrel or Limestone, and nothing may emit
 * Review or AggregateRating, because either would assert to a search engine
 * that a real company was really measured — which is exactly the claim the
 * on-page disclosure banner exists to prevent.
 *
 * The only Organization in the graph is ours, as publisher of the document.
 * That one is true.
 */
export function researchArticleSchema(article: {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedAt?: string;
  author: string;
}): JsonLdObject {
  const url = absolute(`${routes.research}/${article.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: `${article.date}T00:00:00+00:00`,
    // Same rule the blog's Article node follows: present only where the
    // artifact was actually revised, read from the field the sitemap emits as
    // `lastmod`, so the graph and the sitemap agree.
    ...(article.updatedAt
      ? { dateModified: `${article.updatedAt}T00:00:00+00:00` }
      : {}),
    author: personSchema(article.author),
    publisher: organization,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
}

/**
 * Dataset descriptors, keyed by the artifact that publishes them.
 *
 * A registry rather than frontmatter fields, because these describe the data
 * behind a report, not the document — and because keying by slug fails safe:
 * an artifact with no entry emits no Dataset, which is the right default. A
 * future data report adds a key here deliberately rather than inheriting
 * another report's dataset name by accident.
 *
 * No `identifier`. A DOI would be the natural one, and we do not have one —
 * inventing a persistent identifier for a dataset is worse than omitting it.
 */
const DATASETS: Record<
  string,
  { name: string; temporalCoverage: string; variableMeasured: string[] }
> = {
  "crawlmouse-dataset-report": {
    name: "Crawlmouse Small-Business Website Structure Dataset (2026)",
    temporalCoverage: "2026-06-15/2026-08-16",
    // The five findings the report publishes, named as what each measures.
    variableMeasured: [
      "Orphan pages",
      "Anchor-text over-optimization",
      "Internal-linking score by site size",
      "Internal-linking grade distribution",
      "Internal-linking score by platform",
    ],
  },
  // Every value here is read off the study's own prose rather than supplied
  // separately. `temporalCoverage` is the month, not a day range: the article
  // says "early September 2026" and dates the study to September, and a
  // precise start and end would be a claim the document does not make.
  "gulf-smb-websites-ai-search-study": {
    name: "Crawlmouse Gulf Small-Business Website Structure Dataset (2026)",
    temporalCoverage: "2026-09",
    // The five figures the study's key-numbers section publishes.
    variableMeasured: [
      "Orphan pages",
      "Readability without JavaScript",
      "Anchor-text over-optimization",
      "Crawl completion rate",
      "Internal-linking grade distribution",
    ],
  },
};

/**
 * Dataset for a research artifact that publishes original data.
 *
 * Returns null for everything else, so the markup only ever claims a dataset
 * exists where one does. `isBasedOn` points at the tool the data comes from,
 * which is the honest provenance statement: these numbers are aggregates over
 * Crawlmouse's own audit database, not a third-party corpus.
 */
export function datasetSchema(article: {
  slug: string;
  description: string;
}): JsonLdObject | null {
  const dataset = DATASETS[article.slug];
  if (!dataset) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: dataset.name,
    description: article.description,
    url: absolute(`${routes.research}/${article.slug}`),
    temporalCoverage: dataset.temporalCoverage,
    variableMeasured: dataset.variableMeasured,
    // CC BY 4.0, matching the grant the report states in its own prose. Google
    // reads this field against what the page visibly says, so the two ship
    // together or not at all.
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: "Nahl Technologies",
      url: siteUrl,
    },
    isBasedOn: productLinks.crawlmouse,
  };
}

/**
 * FAQPage, built from the question-and-answer pairs parsed out of the body.
 * Returns null when the document has no FAQ section, so a page never emits an
 * empty FAQPage — which Google treats as invalid rather than absent.
 *
 * Takes the parsed entries rather than a whole `Post`, because blog posts and
 * research artifacts both carry them and the markup is identical either way.
 * What is *not* identical is where they come from: both are parsed out of the
 * visible prose, so neither can drift from what the page actually says.
 */
export function faqSchema(document: {
  faq: readonly FaqEntry[];
}): JsonLdObject | null {
  if (document.faq.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: document.faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

/** NAP address, from the same constants the footer renders. */
function postalAddress(): JsonLdObject {
  return {
    "@type": "PostalAddress",
    streetAddress: contactDetails.street,
    addressLocality: contactDetails.locality,
    addressRegion: contactDetails.region,
    postalCode: contactDetails.postalCode,
    addressCountry: contactDetails.country,
  };
}

/**
 * Organization — emitted on every page from the locale layout.
 *
 * `sameAs` lists profiles that are demonstrably ours. It is an identity claim,
 * not a link farm: anything we cannot prove we control does not belong here.
 *
 * It carries company profiles only. The founder's personal LinkedIn is not one
 * — it is already on his Person node via the author registry, and listing a
 * personal profile under the company asserts that the individual and the
 * organisation are the same entity. `companyProfiles` is built from the same
 * constants the footer renders, so this cannot claim a profile the site does
 * not link to.
 */
export function organizationSchema(t: Dictionary): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: t.site.name,
    legalName: t.site.legalName,
    // The canonical short descriptor, read from the same key the home and
    // About pages put in their meta description. One string, three surfaces:
    // the node cannot describe a different company than the pages do.
    description: t.site.description,
    url: siteUrl,
    // File-convention icon route, so the logo cannot 404 the way a static
    // /logo.png path would once the asset is replaced.
    logo: absolute("/icon"),
    email: contactDetails.email,
    telephone: contactDetails.phoneDisplay,
    address: postalAddress(),
    areaServed: AREA_SERVED,
    knowsAbout: KNOWS_ABOUT,
    // Five profiles now: the GitHub account joined `socialLinks` on the
    // founder's decision, so it reaches this list the same way the other four
    // do — through a real, visible footer link. The invariant held rather than
    // being worked around: nothing is claimed here that the site does not link.
    sameAs: companyProfiles,
  };
}

/**
 * WebSite — emitted on every page.
 *
 * No `potentialAction`/SearchAction. That property advertises a site search
 * endpoint, and this site has none; declaring one would point Google at a URL
 * template that does not resolve.
 */
export function webSiteSchema(t: Dictionary): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: t.site.name,
    url: siteUrl,
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * LocalBusiness, as its ProfessionalService subtype — home and contact only.
 *
 * Every NAP value comes from `contactDetails`, which is also what the footer
 * renders, so the two cannot drift out of sync with each other or with the
 * Google Business Profile they are required to match (ARCH-1 §7).
 *
 * `geo` is deliberately absent. LocalBusiness does not require it, and the
 * authoritative coordinates are the GBP pin — which is added after cutover
 * once confirmed. A city centroid would sit ~10 miles from the street address
 * declared three lines above it.
 */
export function localBusinessSchema(t: Dictionary): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": LOCAL_BUSINESS_ID,
    name: t.site.legalName,
    url: siteUrl,
    telephone: contactDetails.phoneDisplay,
    email: contactDetails.email,
    address: postalAddress(),
    // The same ten countries the Organization claims. The Indianapolis half
    // of the old value is not lost by dropping the City node: `address` three
    // lines up carries the locality, which is the stronger local signal and
    // the one the Google Business Profile is matched against.
    areaServed: AREA_SERVED,
    parentOrganization: { "@id": ORGANIZATION_ID },
  };
}

const routeKeyByPath = new Map<string, RouteKey>(
  (Object.entries(routes) as [RouteKey, string][]).map(([key, path]) => [
    path,
    key,
  ]),
);

/**
 * BreadcrumbList for any page below the home page.
 *
 * The trail is derived from the path against the route registry, so a crumb
 * can only exist if the page does — hard rule 7 applied to structured data. A
 * path segment that is not itself a route (`/legal`) is skipped rather than
 * linked, because `/legal` does not resolve.
 *
 * `leafName` names the final crumb for pages whose title is not in the
 * dictionary — blog posts, whose titles live in their own frontmatter.
 * Returns null for the home page: a one-item breadcrumb says nothing.
 */
export function breadcrumbSchema(
  t: Dictionary,
  path: string,
  leafName?: string,
): JsonLdObject | null {
  const segments = path.split("/").filter(Boolean);
  const items = [{ name: t.pages.home.title, url: absolute(routes.home) }];

  let cumulative = "";
  segments.forEach((segment, index) => {
    cumulative += `/${segment}`;
    const routeKey = routeKeyByPath.get(cumulative);
    const isLeaf = index === segments.length - 1;
    const name = routeKey
      ? t.pages[routeKey].title
      : isLeaf
        ? leafName
        : undefined;

    if (name) items.push({ name, url: absolute(cumulative) });
  });

  if (items.length < 2) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Service + Offer for one service page.
 *
 * The price is parsed out of the same string the PriceCard renders. Software
 * development publishes a range rather than a figure, so it yields no price
 * and ships an Offer without one — which is the accurate statement.
 */
export function serviceSchema(t: Dictionary, key: ServiceKey): JsonLdObject {
  const url = absolute(routes[key]);
  const { amount, unit } = t.servicePages[key].price;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: t.pages[key].title,
    serviceType: t.pages[key].title,
    description: t.serviceSummaries[key],
    url,
    provider: { "@id": ORGANIZATION_ID },
    areaServed: AREA_SERVED,
    offers: offer(url, parsePublishedPrice(amount), `${amount} ${unit}`),
  };
}

/**
 * The countries each market page claims, as ISO 3166-1 alpha-2 codes.
 *
 * Every one of these is a subset of `AREA_SERVED`: a market page cannot claim
 * a country the Organization does not, and `schema-org.test.ts` asserts that
 * rather than trusting it. The graph's outer boundary stays the one constant
 * at the top of this file; these narrow it per page.
 *
 * Countries only — no `City` objects. The Indianapolis exception is the sole
 * place a City appears, and it stays sole (see the block on `AREA_SERVED`).
 * A market page's subject is a territory, not a locality, and a city node
 * here would be claiming a physical presence that does not exist: the Gulf
 * page says out loud that we have no Gulf office, and the markup has to agree
 * with the sentence.
 */
const MARKET_COUNTRIES = {
  marketCanada: ["CA"],
  marketGulf: ["AE", "SA", "QA", "KW", "BH", "OM"],
  marketCentralAsia: ["KZ"],
  marketNewZealand: ["NZ"],
} as const satisfies Record<MarketKey, readonly string[]>;

/**
 * Service + FAQPage subject for one market page.
 *
 * No `offers`, unlike `serviceSchema` and `localServiceSchema`. Those two
 * read a published figure — a service page's price field, the mirrored rate
 * card — and these pages have neither: their prices live inside approved
 * prose. Parsing a dollar amount back out of a sentence to build an Offer
 * would be inventing structured data from copy, which is the failure this
 * whole file is written to avoid. The prices are still held to `/pricing`,
 * by assertion in `markets.test.ts`.
 */
export function marketServiceSchema(
  t: Dictionary,
  key: MarketKey,
): JsonLdObject {
  const url = absolute(routes[key]);

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: t.pages[key].title,
    serviceType: "AI consulting",
    description: t.pages[key].description,
    url,
    provider: { "@id": ORGANIZATION_ID },
    areaServed: MARKET_COUNTRIES[key].map((name) => ({
      "@type": "Country",
      name,
    })),
  };
}

/**
 * Service for the manufacturers landing page.
 *
 * `areaServed` is the shared `AREA_SERVED`, by reference rather than by copy:
 * the page sells to manufacturers wherever the firm sells, so it claims
 * exactly the ten countries the Organization does and cannot drift from
 * them. **No City nodes.** The copy says we drive to plants across Indiana,
 * but that is a travel radius, not a service footprint, and the Indianapolis
 * page stays the graph's sole City exception.
 *
 * No `offers`, for the reason `marketServiceSchema` gives: the prices on this
 * page are inside approved prose, and parsing them back out of sentences
 * would be synthesising markup from copy. `manufacturing.test.ts` holds those
 * figures to /pricing instead.
 */
export function manufacturingServiceSchema(t: Dictionary): JsonLdObject {
  const url = absolute(routes.manufacturing);

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: "AI and Automation for Manufacturers",
    serviceType: "AI consulting",
    description: t.pages.manufacturing.description,
    url,
    provider: { "@id": ORGANIZATION_ID },
    areaServed: AREA_SERVED,
  };
}

/**
 * The Google Business Profile service areas, as places.
 *
 * Twenty cities, all Indiana, in the order the Business Profile lists them.
 * This is the *only* place in the graph where a City node appears — see the
 * exception block on `AREA_SERVED` above, and do not add one elsewhere.
 *
 * It lives here rather than in the shared constant on purpose: this list is
 * the local footprint of one page, and keeping it beside that page's builder
 * means widening it cannot reach Organization, LocalBusiness or the five
 * service nodes.
 *
 * The list is not derived from the page's prose, and that is the point. The
 * page names eight of these out loud; the other twelve are served without
 * being listed in a sentence. What this has to match is the Business Profile,
 * character for character, because AI systems corroborate a local business
 * across sources and a service area that disagrees with the GBP entry reads
 * as two different businesses. `ai-consulting-indianapolis.test.ts` pins the
 * twenty against an independent copy of the approved list, and separately
 * checks that every city the page does name appears among them.
 */
const GBP_SERVICE_AREA: readonly string[] = [
  "Indianapolis",
  "Carmel",
  "Fishers",
  "Noblesville",
  "Westfield",
  "Zionsville",
  "Greenwood",
  "Avon",
  "Plainfield",
  "Brownsburg",
  "Lawrence",
  "Anderson",
  "Muncie",
  "Kokomo",
  "Lafayette",
  "Columbus",
  "Bloomington",
  "Fort Wayne",
  "Terre Haute",
  "Evansville",
];

/**
 * Service for the Indianapolis landing page.
 *
 * Separate from `serviceSchema` because it is not one of the five: it has no
 * `ServiceKey`, its offers come from the mirrored rate-card table rather than
 * a single published price, and its `areaServed` is the Business Profile's
 * cities rather than the shared countries. Sharing the builder would have
 * meant three conditionals inside it for one caller — and would have put the
 * City exception one boolean away from every other Service node.
 *
 * `offers` is an array built from the same rows the table renders — no figure
 * is written here, so the markup cannot quote a price the page does not show.
 * "custom" parses to nothing and ships as an Offer with no price, exactly as
 * it does on /pricing.
 */
export function localServiceSchema(t: Dictionary): JsonLdObject {
  const url = absolute(routes.aiConsultingIndianapolis);

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: "AI Consulting in Indianapolis",
    serviceType: "AI consulting",
    description: t.pages.aiConsultingIndianapolis.description,
    url,
    provider: { "@id": ORGANIZATION_ID },
    areaServed: GBP_SERVICE_AREA.map((name) => ({ "@type": "City", name })),
    offers: localPricingRows(t).map((row) => ({
      ...offer(url, parsePublishedPrice(row.offerAmount), row.offerAmount),
      name: row.engagement,
      description: row.detail,
      itemOffered: { "@type": "Service", name: row.engagement },
    })),
  };
}

/**
 * FAQPage for a dictionary-backed page.
 *
 * `faqSchema` above takes documents whose entries were parsed out of MDX
 * prose. These entries come from the dictionary the page renders, which gives
 * the same guarantee by a different route: one source, read twice.
 */
export function dictionaryFaqSchema(
  items: readonly { question: string; answer: string }[],
): JsonLdObject | null {
  if (items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

/**
 * OfferCatalog for the pricing page — the published ladder, tiers then builds,
 * in the order the page lists them. "custom" carries no figure and so ships as
 * an Offer with no price.
 */
export function offerCatalogSchema(t: Dictionary): JsonLdObject {
  const url = absolute(routes.pricing);

  const entries = [
    ...t.pricing.tiers.map((tier) => ({
      name: tier.name,
      description: tier.description,
      source: `${tier.price} ${tier.unit}`,
      amount: tier.price,
    })),
    ...t.pricing.projects.map((project) => ({
      name: project.name,
      description: project.note,
      source: project.price,
      amount: project.price,
    })),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: t.pages.pricing.title,
    url,
    provider: { "@id": ORGANIZATION_ID },
    itemListElement: entries.map((entry, index) => ({
      ...offer(url, parsePublishedPrice(entry.amount), entry.source),
      position: index + 1,
      name: entry.name,
      description: entry.description,
      itemOffered: { "@type": "Service", name: entry.name },
    })),
  };
}

/**
 * SoftwareApplication for Crawlmouse. Free, so the Offer carries a real
 * `price: 0` rather than being omitted — zero is a published price.
 */
export function crawlmouseSchema(t: Dictionary): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t.pages.crawlmouse.title,
    description: t.productSummaries.crawlmouse,
    url: productLinks.crawlmouse,
    applicationCategory: "SEO tool",
    publisher: { "@id": ORGANIZATION_ID },
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
  };
}

/**
 * SoftwareApplication for Hafsa Sastho.
 *
 * `url` is our own product page, not a store listing: `productLinks.hafsaSastho`
 * is null until the Play Store URL exists, and pointing at a guessed store URL
 * is the same error as rendering a dead "Try it live" button.
 *
 * No `offers` — nothing about its price has been published. No
 * `aggregateRating`, here or anywhere.
 */
export function hafsaSasthoSchema(t: Dictionary): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t.pages.hafsaSastho.title,
    description: t.productSummaries.hafsaSastho,
    url: absolute(routes.hafsaSastho),
    operatingSystem: "Android",
    // The site labels it beta (`productStatus.closedBeta`), so the markup does
    // too rather than implying a general release.
    softwareVersion: "beta",
    releaseDate: "2026-09-01",
    publisher: { "@id": ORGANIZATION_ID },
  };
}
