import Link from "next/link";

/**
 * One run of a paragraph: plain text, or text that is a link.
 *
 * Approved copy with links mid-sentence is stored as the sentence cut at each
 * anchor, so the segments rejoin to the approved paragraph character for
 * character. `link` is a key, not an href: the destination comes from the
 * route registry through `hrefs`, so an anchor cannot outlive its target.
 */
export type TextSegment = { text: string; link?: string };

/**
 * Renders segments in order. A segment whose key has no destination renders
 * as plain text: the words stay, an anchor with nowhere to go does not.
 * Internal hrefs go through next/link; anything else is a plain anchor, the
 * same split the article routes make.
 */
export function LinkedText({
  segments,
  hrefs = {},
}: {
  segments: readonly TextSegment[];
  hrefs?: Readonly<Record<string, string>>;
}) {
  return segments.map((segment) => {
    const href = segment.link ? hrefs[segment.link] : undefined;
    if (!href) return segment.text;
    return href.startsWith("/") ? (
      <Link key={segment.text} href={href}>
        {segment.text}
      </Link>
    ) : (
      <a
        key={segment.text}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {segment.text}
      </a>
    );
  });
}
