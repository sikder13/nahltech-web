import GithubSlugger from "github-slugger";
import { z } from "zod";

/**
 * Parsing shared by every MDX collection (currently content/blog and
 * content/research).
 *
 * These live here rather than in one loader that the other imports, because
 * the two collections have genuinely different gates — research is exempt from
 * the blog's sibling-link rule — and the shape that gets copied when you split
 * loaders is the parsing, not the rules. One copy of the parsing, two sets of
 * rules.
 */

/**
 * YAML parses an unquoted `2026-08-12` into a Date, and a quoted one into a
 * string. Both are reasonable things for an author to write, so both are
 * accepted and normalised to `YYYY-MM-DD` rather than making the quoting
 * style load-bearing.
 */
export const isoDate = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD"),
);

/** Matches markdown links to site-internal paths: `[text](/some/path)`. */
const INTERNAL_LINK = /\]\((\/[^)\s]*)\)/g;

export function internalLinks(body: string): string[] {
  return [...body.matchAll(INTERNAL_LINK)].map((match) => match[1]);
}

export type Heading = { id: string; text: string };

/**
 * h2s only. h1 is the title, rendered by the template, and anything deeper
 * would make the table of contents a second navigation problem.
 */
export function extractHeadings(body: string): Heading[] {
  const slugger = new GithubSlugger();
  return [...body.matchAll(/^##\s+(.+?)\s*$/gm)].map((match) => ({
    // Same slugger rehype-slug uses, so the anchors it emits and the hrefs
    // here cannot drift apart.
    id: slugger.slug(match[1]),
    text: match[1],
  }));
}

/** Reduces inline markdown to the plain text a schema consumer should see. */
export function toPlainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export type FaqEntry = { question: string; answer: string };

/**
 * Pull the question-and-answer pairs out of a document's FAQ section.
 *
 * The FAQPage structured data is built from this rather than written by hand
 * beside the prose, so the markup a search engine reads and the text a visitor
 * reads cannot drift apart. Editing a question in the MDX changes the schema
 * in the same edit.
 *
 * Each h3 in the section is a question; everything until the next h3, the next
 * h2, or a thematic break is its answer. The heading match is deliberately
 * loose — the research artifacts head this section "Questions Indianapolis
 * service businesses ask us about this" rather than the blog's wording.
 */
export function extractFaq(body: string): FaqEntry[] {
  const lines = body.split("\n");
  const start = lines.findIndex((line) =>
    /^##\s+.*(frequently asked questions|questions .*ask us)/i.test(line),
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
