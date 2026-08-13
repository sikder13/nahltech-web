import {
  ArticleLayout,
  Byline,
  RelatedPosts,
  TableOfContents,
  type Heading,
  type RelatedArticle,
} from "@/components/blocks/article-blocks";
import { Prose } from "@/components/ui/Prose";
import { getAuthorProfileUrl } from "@/lib/authors";

import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { ReactNode } from "react";

/**
 * T4 — article, used by blog posts and research pieces.
 *
 * The body arrives as children so this template can wrap MDX output verbatim
 * in Phase 3 without change. `CtaSlim` is exported separately for placement
 * mid-article from within the MDX itself, which is the only place that knows
 * where a natural break falls.
 */
export function ArticleTemplate({
  t,
  title,
  author,
  date,
  dateTime,
  headings,
  related,
  banner,
  children,
}: {
  t: Dictionary;
  title: string;
  author: string;
  date: string;
  dateTime: string;
  headings: readonly Heading[];
  related: readonly RelatedArticle[];
  /** Rendered above the h1. Used for the sample-engagement disclosure. */
  banner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className="mx-auto max-w-(--container-page) px-sm pt-2xl pb-lg">
        {/* Above the h1 on purpose. A disclosure a reader meets after the
            first number has already failed at its job. */}
        {banner ? <div className="mb-lg max-w-prose">{banner}</div> : null}
        <h1 className="max-w-prose text-section text-balance text-text">
          {title}
        </h1>
        <span className="mt-md heading-rule" aria-hidden="true" />
        <Byline
          byLabel={t.article.byLabel}
          author={author}
          date={date}
          dateTime={dateTime}
          profileUrl={getAuthorProfileUrl(author)}
        />
      </div>

      <ArticleLayout
        aside={
          <TableOfContents heading={t.article.tocHeading} headings={headings} />
        }
      >
        <Prose>{children}</Prose>
      </ArticleLayout>

      <RelatedPosts heading={t.article.relatedHeading} articles={related} />
    </>
  );
}
