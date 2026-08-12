import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { getPostBySlug, getPublishedPosts, getRelatedPosts } from "@/lib/blog";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { formatPostDate } from "@/lib/format-date";
import { articleSchema, faqSchema } from "@/lib/schema-org";

import { JsonLd } from "@/components/seo/JsonLd";
import { ArticleTemplate } from "@/components/templates/ArticleTemplate";

import type { Metadata } from "next";
import type { AnchorHTMLAttributes } from "react";

/**
 * Blog post route.
 *
 * Statically generated from content/blog at build time. ARCH-1 §7 pencils in
 * ISR at an hour, but the source is MDX committed to this repo: there is no
 * out-of-band content to revalidate against, so a rebuild is the only thing
 * that can change a post. ISR would add a moving part with nothing to catch.
 */

export function generateStaticParams() {
  return getPublishedPosts().map((post) => ({ slug: post.slug }));
}

/** Internal hrefs go through next/link; everything else is a plain anchor. */
const mdxComponents = {
  a: ({ href = "", ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) =>
    href.startsWith("/") ? (
      <Link href={href} {...rest} />
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest} />
    ),
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || post.draft) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      authors: [post.author],
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

  const post = getPostBySlug(slug);
  if (!post || post.draft) notFound();

  const related = getRelatedPosts(post).map((item) => ({
    title: item.title,
    excerpt: item.description,
    href: `/blog/${item.slug}`,
    meta: formatPostDate(item.date),
    // No article imagery exists yet, so the placeholder is described by the
    // piece it stands for rather than by a generic word.
    imageLabel: item.title,
  }));

  const faq = faqSchema(post);

  return (
    <>
      <JsonLd data={articleSchema(post)} />
      {/* Derived from the FAQ section's own h3s and prose, so the markup and
          the visible text cannot drift apart. */}
      {faq ? <JsonLd data={faq} /> : null}
      <ArticleTemplate
        t={t}
        title={post.title}
        author={post.author}
        date={formatPostDate(post.date)}
        dateTime={post.date}
        headings={post.headings}
        related={related}
      >
        <MDXRemote
          source={post.body}
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              // Emits the same ids the table of contents links to.
              rehypePlugins: [rehypeSlug],
            },
          }}
        />
      </ArticleTemplate>
    </>
  );
}
