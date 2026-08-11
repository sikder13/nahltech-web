import "server-only";

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import { z } from "zod";

import { allRoutePaths } from "@/lib/routes";

/**
 * MDX loader and build-time gates for content/blog (ARCH-1 §4.3).
 *
 * The internal-linking rules are enforced here rather than left to
 * convention, so a post that would orphan itself fails the build instead of
 * shipping. That is the whole point: "zero orphans" has to survive content
 * being added weekly under time pressure, and a rule nothing checks is a rule
 * that decays.
 *
 * Every failure throws with the offending filename in the message — a build
 * log that says "invalid frontmatter" without naming the file costs more time
 * than the gate saves.
 */

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export const clusters = ["field-notes", "brand", "archive"] as const;
export type Cluster = (typeof clusters)[number];

/**
 * Clusters exempt from the linking and keyword gates.
 *
 * `archive` is heritage content migrated as-is; `brand` is the company's own
 * story. Neither is an SEO play, so requiring a target keyword and a service
 * link would force dishonest links into essays that do not want them. They
 * still have to satisfy the frontmatter schema.
 */
const GATE_EXEMPT: ReadonlySet<string> = new Set<Cluster>(["brand", "archive"]);

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD"),
  author: z.string().min(1),
  cluster: z.enum(clusters),
  targetKeyword: z.string().min(1).nullable(),
  serviceLinks: z.array(z.string()),
  draft: z.boolean().default(false),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export type Post = Frontmatter & {
  slug: string;
  body: string;
  headings: { id: string; text: string }[];
};

class BlogContentError extends Error {
  constructor(file: string, detail: string) {
    super(`content/blog/${file}: ${detail}`);
    this.name = "BlogContentError";
  }
}

/** Matches markdown links to site-internal paths: `[text](/some/path)`. */
const INTERNAL_LINK = /\]\((\/[^)\s]*)\)/g;

function internalLinks(body: string): string[] {
  return [...body.matchAll(INTERNAL_LINK)].map((match) => match[1]);
}

/**
 * h2s only. h1 is the title, rendered by the template, and anything deeper
 * would make the table of contents a second navigation problem.
 */
function extractHeadings(body: string): { id: string; text: string }[] {
  const slugger = new GithubSlugger();
  return [...body.matchAll(/^##\s+(.+?)\s*$/gm)].map((match) => ({
    // Same slugger rehype-slug uses, so the anchors it emits and the hrefs
    // here cannot drift apart.
    id: slugger.slug(match[1]),
    text: match[1],
  }));
}

/**
 * Validate one post and run the gates for its cluster.
 *
 * `knownSlugs` is the full set in the collection, so a sibling link that
 * points at a post which does not exist fails here rather than shipping as a
 * dead anchor (hard rule 7).
 */
export function validatePost(
  file: string,
  raw: string,
  knownSlugs: ReadonlySet<string>,
): Post {
  const slug = file.replace(/\.mdx?$/, "");

  const parsed = matter(raw);
  const result = frontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`)
      .join("; ");
    throw new BlogContentError(file, `invalid frontmatter — ${detail}`);
  }

  const frontmatter = result.data;
  const body = parsed.content;
  const links = internalLinks(body);

  // Applies to every cluster: a link that resolves to nothing is a bug
  // whether or not the post is an SEO play.
  const knownPaths = new Set<string>(allRoutePaths);
  for (const href of links) {
    const [pathname] = href.split("#");
    if (pathname.startsWith("/blog/")) {
      const target = pathname.slice("/blog/".length);
      if (!knownSlugs.has(target)) {
        throw new BlogContentError(
          file,
          `links to /blog/${target}, which is not a post in content/blog`,
        );
      }
      continue;
    }
    if (pathname && !knownPaths.has(pathname)) {
      throw new BlogContentError(
        file,
        `links to ${pathname}, which is not a route in lib/routes.ts`,
      );
    }
  }

  if (!GATE_EXEMPT.has(frontmatter.cluster)) {
    if (frontmatter.targetKeyword === null) {
      throw new BlogContentError(
        file,
        `cluster "${frontmatter.cluster}" requires a targetKeyword (only ${[...GATE_EXEMPT].join(" and ")} may omit one)`,
      );
    }

    const offerLinks = links.filter(
      (href) => href.startsWith("/services/") || href.startsWith("/products/"),
    );
    if (offerLinks.length < 1) {
      throw new BlogContentError(
        file,
        `cluster "${frontmatter.cluster}" requires at least one link to a /services/* or /products/* page; found none`,
      );
    }

    const siblings = new Set(
      links
        .filter((href) => href.startsWith("/blog/"))
        .map((href) => href.split("#")[0].slice("/blog/".length))
        .filter((target) => target !== slug),
    );
    if (siblings.size < 2) {
      throw new BlogContentError(
        file,
        `cluster "${frontmatter.cluster}" requires at least two links to sibling posts; found ${siblings.size}`,
      );
    }
  }

  return {
    ...frontmatter,
    slug,
    body,
    headings: extractHeadings(body),
  };
}

let cache: Post[] | null = null;

/**
 * Every post in the collection, drafts included, newest first.
 *
 * Validation runs across the whole set at once because the sibling-link gate
 * needs to know which slugs exist.
 */
export function loadAllPosts(): Post[] {
  if (cache) return cache;

  let files: string[];
  try {
    files = readdirSync(BLOG_DIR).filter((file) => /\.mdx?$/.test(file));
  } catch {
    // No content directory yet is a valid state — the hub renders empty.
    return (cache = []);
  }

  const knownSlugs = new Set(files.map((file) => file.replace(/\.mdx?$/, "")));

  const posts = files.map((file) =>
    validatePost(
      file,
      readFileSync(path.join(BLOG_DIR, file), "utf8"),
      knownSlugs,
    ),
  );

  posts.sort((a, b) => b.date.localeCompare(a.date));
  return (cache = posts);
}

/** Published posts only — what the hub, the feed and the sitemap list. */
export function getPublishedPosts(): Post[] {
  return loadAllPosts().filter((post) => !post.draft);
}

export function getPostBySlug(slug: string): Post | undefined {
  return loadAllPosts().find((post) => post.slug === slug);
}

/**
 * Related reading: same cluster first, then the most recent of the rest.
 * Drafts never surface.
 */
export function getRelatedPosts(post: Post, limit = 3): Post[] {
  const others = getPublishedPosts().filter((item) => item.slug !== post.slug);
  const sameCluster = others.filter((item) => item.cluster === post.cluster);
  const rest = others.filter((item) => item.cluster !== post.cluster);
  return [...sameCluster, ...rest].slice(0, limit);
}

/** Test seam: clears the memoised collection. */
export function resetBlogCacheForTests() {
  cache = null;
}
