import { getAuthor } from "@/lib/authors";
import {
  companyProfiles,
  contactDetails,
  productLinks,
  routes,
  siteUrl,
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
 * Where we work. Indianapolis is where we are; "Worldwide" is the honest
 * second half — the delivery model is remote and the relay says so.
 */
const AREA_SERVED: readonly unknown[] = [
  { "@type": "City", name: "Indianapolis" },
  "Worldwide",
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
  author: string;
}): JsonLdObject {
  const url = absolute(`${routes.research}/${article.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: `${article.date}T00:00:00+00:00`,
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
    url: siteUrl,
    // File-convention icon route, so the logo cannot 404 the way a static
    // /logo.png path would once the asset is replaced.
    logo: absolute("/icon"),
    email: contactDetails.email,
    telephone: contactDetails.phoneDisplay,
    address: postalAddress(),
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
