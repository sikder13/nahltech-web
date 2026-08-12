import { routes, siteUrl } from "@/lib/routes";

import type { Post } from "@/lib/blog";

/**
 * JSON-LD builders (ARCH-1 §7).
 *
 * Everything here is derived from the same values the page renders, never
 * written twice. Structured data that restates the visible content by hand is
 * structured data that will eventually contradict it, and a contradiction is
 * worse than an absence: it is a claim to a search engine that the page does
 * not support.
 *
 * Only Article and FAQPage so far. BreadcrumbList, Organization, WebSite,
 * LocalBusiness, Service and OfferCatalog are Phase 5's.
 */

export type JsonLdObject = Record<string, unknown>;

const organization = {
  "@type": "Organization",
  name: "Nahl Technologies",
  url: siteUrl,
} as const;

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
    author: {
      "@type": "Person",
      name: post.author,
      url: new URL(routes.about, siteUrl).toString(),
    },
    publisher: organization,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
}

/**
 * FAQPage, built from the question-and-answer pairs parsed out of the post
 * body. Returns null when the post has no FAQ section, so a page never emits
 * an empty FAQPage — which Google treats as invalid rather than absent.
 */
export function faqSchema(post: Post): JsonLdObject | null {
  if (post.faq.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}
