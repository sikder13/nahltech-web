import { CardGrid, ArticleCard } from "@/components/blocks/cards";
import { SectionHeading } from "@/components/ui/SectionHeading";

import type { ReactNode } from "react";

export type Heading = { id: string; text: string };

export type RelatedArticle = {
  title: string;
  excerpt: string;
  href: string;
  meta: string;
  imageLabel: string;
};

/**
 * Author and publication date.
 *
 * The date is wrapped in <time datetime> so it is machine-readable now; the
 * Person and Article JSON-LD that consumes the same values arrives in Phase 5.
 */
export function Byline({
  byLabel,
  author,
  date,
  dateTime,
}: {
  byLabel: string;
  author: string;
  date: string;
  dateTime: string;
}) {
  return (
    <p className="mt-md flex flex-wrap items-center gap-2xs text-sm text-text-muted">
      <span>
        {byLabel} <span className="font-medium text-text">{author}</span>
      </span>
      <span aria-hidden="true">·</span>
      <time dateTime={dateTime}>{date}</time>
    </p>
  );
}

/**
 * Table of contents, built from the article's h2s.
 *
 * Hidden below lg because it duplicates content that is only a scroll away on
 * a narrow screen. `aria-hidden` is deliberately not used — it is a real nav
 * landmark when visible, and display:none already removes it from the
 * accessibility tree when it is not.
 */
export function TableOfContents({
  heading,
  headings,
}: {
  heading: string;
  headings: readonly Heading[];
}) {
  if (headings.length === 0) return null;

  return (
    <nav aria-label={heading} className="hidden lg:block">
      <p className="text-sm font-semibold text-text">{heading}</p>
      <ol className="mt-xs space-y-3xs border-s border-divider ps-sm">
        {headings.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-sm text-text-muted link-accent hover:text-text"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function RelatedPosts({
  heading,
  articles,
}: {
  heading: string;
  articles: readonly RelatedArticle[];
}) {
  if (articles.length === 0) return null;

  return (
    <section className="border-t border-divider">
      <div className="mx-auto max-w-(--container-page) px-sm py-2xl">
        <SectionHeading>{heading}</SectionHeading>
        <div className="mt-lg">
          <CardGrid columns={3}>
            {articles.map((article) => (
              <ArticleCard key={article.href} {...article} />
            ))}
          </CardGrid>
        </div>
      </div>
    </section>
  );
}

/**
 * Two-column reading layout: the article column plus a sticky contents rail.
 * The rail is second in the DOM so the article is what a screen reader and a
 * narrow viewport reach first.
 */
export function ArticleLayout({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-(--container-page) px-sm pb-2xl">
      <div className="grid gap-xl lg:grid-cols-[minmax(0,1fr)_16rem]">
        {/* min-w-0 lets the column shrink below its content. Without it a
            grid item is sized by its widest child, so a horizontally
            scrolling table stretches the column and the whole page scrolls
            sideways instead of the table scrolling inside its own box. */}
        <div className="min-w-0">{children}</div>
        {aside ? (
          <aside className="lg:sticky lg:top-24 lg:self-start">{aside}</aside>
        ) : null}
      </div>
    </div>
  );
}
