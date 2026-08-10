import type { ReactNode } from "react";

/**
 * Reading column for long-form content: articles, research and legal pages.
 *
 * Styling is applied through descendant selectors rather than per-element
 * classes so the same wrapper can hold MDX output in Phase 3 without every
 * element needing a class. `max-w-prose` keeps the measure readable.
 *
 * h2 gets the gold rule treatment, matching `heading-rule`. Blockquotes get
 * the gold left border — both permitted decorative uses of the accent.
 */
export function Prose({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "max-w-prose text-text",
        "[&_p]:mt-md [&_p]:leading-relaxed [&_p]:text-text",
        "[&_h2]:mt-xl [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight",
        "[&_h2]:after:mt-xs [&_h2]:after:block [&_h2]:after:h-[3px]",
        "[&_h2]:after:w-12 [&_h2]:after:bg-accent [&_h2]:after:content-['']",
        "[&_h3]:mt-lg [&_h3]:text-lg [&_h3]:font-semibold",
        "[&_ul]:mt-md [&_ul]:list-disc [&_ul]:ps-md",
        "[&_ol]:mt-md [&_ol]:list-decimal [&_ol]:ps-md",
        "[&_li]:mt-2xs [&_li]:text-text",
        "[&_blockquote]:mt-md [&_blockquote]:border-s-4 [&_blockquote]:border-accent",
        "[&_blockquote]:ps-md [&_blockquote]:text-text-muted [&_blockquote]:italic",
        "[&_a]:link-accent [&_a]:underline [&_a]:decoration-accent [&_a]:decoration-2",
        "[&_code]:rounded-sm [&_code]:bg-surface [&_code]:px-3xs [&_code]:font-mono [&_code]:text-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
