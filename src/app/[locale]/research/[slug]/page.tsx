import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { formatPostDate } from "@/lib/format-date";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { getPublishedResearch, getResearchBySlug } from "@/lib/research";
import { routes, ogImagePath } from "@/lib/routes";
import {
  breadcrumbSchema,
  datasetSchema,
  faqSchema,
  researchArticleSchema,
} from "@/lib/schema-org";

import { MethodBox } from "@/components/blocks/MethodBox";
import { SampleBanner } from "@/components/blocks/SampleBanner";
import {
  CallRoutingDiagram,
  DocumentAutomationArchitecture,
  HvacIntakeArchitecture,
  OpsInboxComposition,
  QuotingArchitecture,
  RfqProcessMap,
} from "@/components/blocks/research-diagrams";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArticleTemplate } from "@/components/templates/ArticleTemplate";

import type { Metadata } from "next";
import type { AnchorHTMLAttributes, TableHTMLAttributes } from "react";

/**
 * Research artifact route.
 *
 * Same T4 template the blog uses — these are long-form documents and there is
 * no reason for a second reading experience — plus two things a blog post does
 * not have: the fictional-client disclosure banner, and the diagrams, which
 * are real components rather than fenced ASCII.
 */

export function generateStaticParams() {
  return getPublishedResearch().map((article) => ({ slug: article.slug }));
}

/**
 * Diagrams are referenced by name from the MDX. Passing them here rather than
 * importing inside the content keeps the artifacts plain MDX — an author edits
 * prose, not imports — and means an unknown diagram name fails the build
 * instead of rendering as literal text.
 */
const mdxComponents = {
  MethodBox,
  CallRoutingDiagram,
  HvacIntakeArchitecture,
  RfqProcessMap,
  QuotingArchitecture,
  OpsInboxComposition,
  DocumentAutomationArchitecture,

  /** Internal hrefs go through next/link; everything else is a plain anchor. */
  a: ({ href = "", ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) =>
    href.startsWith("/") ? (
      <Link href={href} {...rest} />
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest} />
    ),

  /** Wide tables scroll inside their own container, keyboard-reachable. */
  table: (props: TableHTMLAttributes<HTMLTableElement>) => (
    <div className="mt-md overflow-x-auto" tabIndex={0}>
      <table {...props} />
    </div>
  ),
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getResearchBySlug(slug);
  if (!article || article.draft) return {};

  return {
    alternates: { canonical: `${routes.research}/${article.slug}` },
    title: article.title,
    description: article.description,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      publishedTime: article.date,
      authors: [article.author],
      // Declaring `openGraph` here stops the file convention's image being
      // inherited, so it is named back explicitly. Without it these pages
      // share with no image and Twitter falls back to a small card.
      images: [ogImagePath],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await requireDictionary(locale);

  const article = getResearchBySlug(slug);
  if (!article || article.draft) notFound();

  const related = getPublishedResearch()
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3)
    .map((item) => ({
      title: item.title,
      excerpt: item.description,
      href: `${routes.research}/${item.slug}`,
      meta: formatPostDate(item.date),
      imageLabel: item.title,
    }));

  // Only the two engagements that actually carry a questions section get
  // one; the builder returns null otherwise rather than emitting an empty
  // FAQPage, which Google reads as invalid rather than absent.
  const faq = faqSchema(article);
  // Only artifacts that publish original data carry one; see the registry.
  const dataset = datasetSchema(article);

  const breadcrumb = breadcrumbSchema(
    t,
    `${routes.research}/${article.slug}`,
    article.title,
  );

  return (
    <>
      {/* Article carries the Person node for the byline. No Organization for
          the fictional companies and no Review anywhere — see the builder. */}
      <JsonLd data={researchArticleSchema(article)} />
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      {/* Parsed from the section's own h3s and prose, so the markup and the
          visible text cannot drift apart. */}
      {faq ? <JsonLd data={faq} /> : null}
      {dataset ? <JsonLd data={dataset} /> : null}
      <ArticleTemplate
        t={t}
        title={article.title}
        author={article.author}
        date={formatPostDate(article.date)}
        dateTime={article.date}
        headings={article.headings}
        related={related}
        banner={
          article.sampleBanner ? (
            <SampleBanner
              label={t.research.sampleLabel}
              lead={t.research.sampleLead}
              body={article.sampleBanner}
            />
          ) : null
        }
      >
        <MDXRemote
          source={article.body}
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug],
            },
          }}
        />
      </ArticleTemplate>
    </>
  );
}
