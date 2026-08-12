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

export const clusters = [
  "field-notes",
  "brand",
  "archive",
  "decision",
] as const;
export type Cluster = (typeof clusters)[number];

/**
 * A cluster has to reach this many published posts before its members are
 * required to link to each other.
 *
 * The first post in a cluster has no siblings to link to, and the second has
 * only one. Enforcing the two-sibling rule from the start would either block
 * the post or force a link to an unrelated cluster, which is the opposite of
 * what the rule is for. Below the threshold the post passes on its service,
 * product or pricing links alone and is reported in a build notice so the
 * links get backfilled as the cluster fills out.
 */
const SIBLING_GATE_MIN_CLUSTER_SIZE = 3;

/** Pages a post may cite to satisfy the "link to something we sell" gate. */
const OFFER_PREFIXES = ["/services/", "/products/"] as const;
const OFFER_EXACT = ["/pricing"] as const;

function isOfferLink(href: string): boolean {
  return (
    OFFER_PREFIXES.some((prefix) => href.startsWith(prefix)) ||
    OFFER_EXACT.includes(href as (typeof OFFER_EXACT)[number])
  );
}

/**
 * Clusters exempt from the linking and keyword gates.
 *
 * `archive` is heritage content migrated as-is; `brand` is the company's own
 * story. Neither is an SEO play, so requiring a target keyword and a service
 * link would force dishonest links into essays that do not want them. They
 * still have to satisfy the frontmatter schema.
 */
const GATE_EXEMPT: ReadonlySet<string> = new Set<Cluster>(["brand", "archive"]);

/**
 * YAML parses an unquoted `2026-08-12` into a Date, and a quoted one into a
 * string. Both are reasonable things for an author to write, so both are
 * accepted and normalised to `YYYY-MM-DD` rather than making the quoting
 * style load-bearing.
 */
const isoDate = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD"),
);

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: isoDate,
  author: z.string().min(1),
  cluster: z.enum(clusters),
  targetKeyword: z.string().min(1).nullable(),
  serviceLinks: z.array(z.string()),
  draft: z.boolean().default(false),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export type FaqEntry = { question: string; answer: string };

export type Post = Frontmatter & {
  slug: string;
  body: string;
  headings: { id: string; text: string }[];
  /** Empty unless the body has a "Frequently asked questions" section. */
  faq: FaqEntry[];
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

/** Reduces inline markdown to the plain text a schema consumer should see. */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pull the question-and-answer pairs out of a post's FAQ section.
 *
 * The FAQPage structured data is built from this rather than written by hand
 * beside the prose, so the markup a search engine reads and the text a visitor
 * reads cannot drift apart. Editing a question in the MDX changes the schema
 * in the same edit.
 *
 * Each h3 in the section is a question; everything until the next h3, the next
 * h2, or a thematic break is its answer.
 */
export function extractFaq(body: string): FaqEntry[] {
  const lines = body.split("\n");
  const start = lines.findIndex((line) =>
    /^##\s+.*frequently asked questions/i.test(line),
  );
  if (start === -1) return [];

  const entries: FaqEntry[] = [];
  let question: string | null = null;
  let answer: string[] = [];

  const flush = () => {
    const text = toPlainText(answer.filter(Boolean).join(" "));
    if (question && text) entries.push({ question, answer: text });
    question = null;
    answer = [];
  };

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s/.test(line) || /^---\s*$/.test(line)) break;

    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      flush();
      question = toPlainText(heading[1]);
      continue;
    }
    if (question) answer.push(line.trim());
  }
  flush();

  return entries;
}

/**
 * Validate one post and run the gates for its cluster.
 *
 * `knownSlugs` is the full set in the collection, so a sibling link that
 * points at a post which does not exist fails here rather than shipping as a
 * dead anchor (hard rule 7).
 *
 * `clusterSize` is how many published posts share this post's cluster. It
 * defaults to enforcing the sibling gate, because a caller that does not know
 * the size should get the stricter behaviour rather than a silent waiver.
 */
export function validatePost(
  file: string,
  raw: string,
  knownSlugs: ReadonlySet<string>,
  clusterSize: number = Number.POSITIVE_INFINITY,
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

    const offerLinks = links.filter(isOfferLink);
    if (offerLinks.length < 1) {
      throw new BlogContentError(
        file,
        `cluster "${frontmatter.cluster}" requires at least one link to a /services/*, /products/* or /pricing page; found none`,
      );
    }

    const siblings = new Set(
      links
        .filter((href) => href.startsWith("/blog/"))
        .map((href) => href.split("#")[0].slice("/blog/".length))
        .filter((target) => target !== slug),
    );

    // Only once the cluster is big enough for two siblings to exist.
    if (clusterSize >= SIBLING_GATE_MIN_CLUSTER_SIZE && siblings.size < 2) {
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
    faq: extractFaq(body),
  };
}

/**
 * Count sibling links, ignoring self-links. Used for the build notice as well
 * as the gate, so the two always agree on what "under quota" means.
 */
export function countSiblingLinks(post: Post): number {
  return new Set(
    internalLinks(post.body)
      .filter((href) => href.startsWith("/blog/"))
      .map((href) => href.split("#")[0].slice("/blog/".length))
      .filter((target) => target !== post.slug),
  ).size;
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

  const sources = new Map(
    files.map((file) => [
      file,
      readFileSync(path.join(BLOG_DIR, file), "utf8"),
    ]),
  );

  // First pass: how big is each cluster? The sibling gate needs to know before
  // it can decide whether to apply. Frontmatter that fails to parse here is
  // left for the validating pass, which reports it properly.
  const clusterSizes = new Map<string, number>();
  for (const raw of sources.values()) {
    const data = matter(raw).data as { cluster?: unknown; draft?: unknown };
    if (typeof data.cluster !== "string" || data.draft === true) continue;
    clusterSizes.set(data.cluster, (clusterSizes.get(data.cluster) ?? 0) + 1);
  }

  const posts = [...sources].map(([file, raw]) => {
    const cluster = matter(raw).data?.cluster;
    return validatePost(
      file,
      raw,
      knownSlugs,
      typeof cluster === "string" ? (clusterSizes.get(cluster) ?? 0) : 0,
    );
  });

  posts.sort((a, b) => b.date.localeCompare(a.date));
  reportSiblingQuota(posts, clusterSizes);
  return (cache = posts);
}

/**
 * Build notice for posts the sibling gate let through because their cluster
 * is still too small.
 *
 * Not a warning: nothing is wrong, and the post was allowed on purpose. It
 * exists so the backfill is visible work rather than something we remember to
 * do. Once a cluster reaches the threshold the gate takes over and these stop
 * being advisory.
 */
function reportSiblingQuota(
  posts: Post[],
  clusterSizes: ReadonlyMap<string, number>,
): void {
  const underQuota = posts.filter(
    (post) =>
      !post.draft &&
      !GATE_EXEMPT.has(post.cluster) &&
      (clusterSizes.get(post.cluster) ?? 0) < SIBLING_GATE_MIN_CLUSTER_SIZE &&
      countSiblingLinks(post) < 2,
  );
  if (underQuota.length === 0) return;

  console.info(
    `NOTICE [blog] ${underQuota.length} post(s) below the two-sibling-link quota, ` +
      `waived because their cluster has fewer than ${SIBLING_GATE_MIN_CLUSTER_SIZE} published posts. ` +
      `Backfill links as each cluster grows:\n` +
      underQuota
        .map(
          (post) =>
            `  - ${post.slug} (cluster "${post.cluster}", ` +
            `${clusterSizes.get(post.cluster) ?? 0} post(s), ` +
            `${countSiblingLinks(post)} sibling link(s))`,
        )
        .join("\n"),
  );
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
