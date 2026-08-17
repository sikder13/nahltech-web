import "server-only";

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { z } from "zod";

import { authorNames, getAuthor } from "@/lib/authors";
import {
  extractFaq,
  extractHeadings,
  internalLinks,
  isoDate,
  type FaqEntry,
  type Heading,
} from "@/lib/mdx";
import { allRoutePaths } from "@/lib/routes";

/**
 * MDX loader and build-time gates for content/research.
 *
 * Research artifacts are long-form and cross-linked by hand — each engagement
 * points at the other two and at the methodology, and the methodology points
 * back out to the blog and the service pages. That structure is deliberate and
 * already denser than the blog's, so these are **exempt from the blog's
 * sibling-link and offer-link gates**: imposing a rule designed for a growing
 * cluster of short posts would only force redundant links into documents that
 * already carry them.
 *
 * What is *not* relaxed is link resolution. Every internal link is checked
 * against the route registry, the blog collection and this collection, so a
 * cross-reference to an artifact that does not exist fails the build rather
 * than shipping as a dead anchor (hard rule 7). That check matters more here
 * than in the blog, because these four files reference each other constantly.
 */

const RESEARCH_DIR = path.join(process.cwd(), "content", "research");

/**
 * What kind of artifact this is. Drives the badge on the hub and nothing else
 * — it is a label for the reader, not a routing decision.
 */
export const researchKinds = [
  "sample-engagement",
  "methodology",
  "data-report",
] as const;
export type ResearchKind = (typeof researchKinds)[number];

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: isoDate,
  author: z.string().min(1),
  kind: z.enum(researchKinds),
  targetKeyword: z.string().min(1).nullable(),
  /**
   * Present only on artifacts describing a fictional client. When it is here,
   * the template renders the disclosure banner above the h1 — see
   * `SampleBanner`. Its presence is the switch; there is no separate boolean
   * to fall out of sync with it.
   */
  sampleBanner: z.string().min(1).optional(),
  draft: z.boolean().default(false),
});

export type ResearchFrontmatter = z.infer<typeof frontmatterSchema>;

export type ResearchArticle = ResearchFrontmatter & {
  slug: string;
  body: string;
  headings: Heading[];
  /** Empty unless the body carries a questions section. */
  faq: FaqEntry[];
};

/**
 * Drop a leading `# Heading` from the body.
 *
 * All four artifacts open with an h1 repeating their own frontmatter title,
 * and the template renders the title itself — so without this every page ships
 * two h1s. Two h1s is not a style question: it is the same heading-structure
 * error as skipping a level, and a screen-reader user navigating by heading
 * hits the document title twice with no way to tell which is the real one.
 *
 * Stripped here rather than edited out of the files, so an author can keep
 * writing the title at the top where it belongs in a plain-markdown editor.
 * Only the first heading, and only if it is the first thing in the document.
 */
function stripLeadingH1(body: string): string {
  return body.replace(/^\s*#\s+.+?\n/, "");
}

class ResearchContentError extends Error {
  constructor(file: string, detail: string) {
    super(`content/research/${file}: ${detail}`);
    this.name = "ResearchContentError";
  }
}

/**
 * Validate one artifact.
 *
 * `knownResearchSlugs` and `knownBlogSlugs` are the two collections this file
 * may reference. Both are passed in rather than read here so validation stays
 * a pure function of its inputs and the tests can drive it with fixtures.
 */
export function validateResearch(
  file: string,
  raw: string,
  knownResearchSlugs: ReadonlySet<string>,
  knownBlogSlugs: ReadonlySet<string>,
): ResearchArticle {
  const slug = file.replace(/\.mdx?$/, "");

  const parsed = matter(raw);
  const result = frontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`)
      .join("; ");
    throw new ResearchContentError(file, `invalid frontmatter — ${detail}`);
  }

  const frontmatter = result.data;

  if (!getAuthor(frontmatter.author)) {
    throw new ResearchContentError(
      file,
      `unknown author "${frontmatter.author}". Add them to lib/authors.ts. Known: ${authorNames.join(", ")}`,
    );
  }

  const body = stripLeadingH1(parsed.content);
  const knownPaths = new Set<string>(allRoutePaths);

  for (const href of internalLinks(body)) {
    const [pathname] = href.split("#");
    if (!pathname) continue;

    if (pathname.startsWith("/research/")) {
      const target = pathname.slice("/research/".length);
      if (!knownResearchSlugs.has(target)) {
        throw new ResearchContentError(
          file,
          `links to /research/${target}, which is not an artifact in content/research`,
        );
      }
      continue;
    }
    if (pathname.startsWith("/blog/")) {
      const target = pathname.slice("/blog/".length);
      if (!knownBlogSlugs.has(target)) {
        throw new ResearchContentError(
          file,
          `links to /blog/${target}, which is not a post in content/blog`,
        );
      }
      continue;
    }
    if (!knownPaths.has(pathname)) {
      throw new ResearchContentError(
        file,
        `links to ${pathname}, which is not a route in lib/routes.ts`,
      );
    }
  }

  return {
    ...frontmatter,
    slug,
    body,
    headings: extractHeadings(body),
    faq: extractFaq(body),
  };
}

let cache: ResearchArticle[] | null = null;

/** Every artifact, drafts included, newest first. */
export function loadAllResearch(): ResearchArticle[] {
  if (cache) return cache;

  let files: string[];
  try {
    files = readdirSync(RESEARCH_DIR).filter((file) => /\.mdx?$/.test(file));
  } catch {
    // No content directory yet is a valid state — the hub renders empty.
    return (cache = []);
  }

  const knownResearchSlugs = new Set(
    files.map((file) => file.replace(/\.mdx?$/, "")),
  );

  // Read the blog's filenames directly rather than importing its loader: the
  // blog runs its own gates, and a failure over there should be reported as a
  // blog error, not surface here as a confusing research error.
  let knownBlogSlugs: ReadonlySet<string>;
  try {
    knownBlogSlugs = new Set(
      readdirSync(path.join(process.cwd(), "content", "blog"))
        .filter((file) => /\.mdx?$/.test(file))
        .map((file) => file.replace(/\.mdx?$/, "")),
    );
  } catch {
    knownBlogSlugs = new Set();
  }

  const articles = files.map((file) =>
    validateResearch(
      file,
      readFileSync(path.join(RESEARCH_DIR, file), "utf8"),
      knownResearchSlugs,
      knownBlogSlugs,
    ),
  );

  // Newest first, then by slug. The tie-break is not cosmetic: the three
  // engagements currently share a publication date, so without it the order
  // is whatever `readdirSync` returned, which is filesystem-dependent and can
  // differ between a local build and CI. Give them distinct dates if a
  // specific reading order is wanted.
  articles.sort(
    (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug),
  );
  return (cache = articles);
}

export function getPublishedResearch(): ResearchArticle[] {
  return loadAllResearch().filter((article) => !article.draft);
}

export function getResearchBySlug(slug: string): ResearchArticle | undefined {
  return loadAllResearch().find((article) => article.slug === slug);
}

/**
 * Hub order, by kind rather than by date.
 *
 * Original data leads: a report built from our own production database is the
 * strongest thing in the section and the one a stranger should meet first. The
 * methodology follows, because it is the spine every other artifact points at
 * and the document that makes them checkable. The engagements come last —
 * they are illustrations of the method, and they describe fictional clients.
 *
 * Within a kind, the loader's newest-first-then-slug order carries through.
 */
const KIND_ORDER: readonly ResearchKind[] = [
  "data-report",
  "methodology",
  "sample-engagement",
];

export function getResearchForHub(): ResearchArticle[] {
  return getPublishedResearch()
    .slice()
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
}

/** Test seam: clears the memoised collection. */
export function resetResearchCacheForTests() {
  cache = null;
}
