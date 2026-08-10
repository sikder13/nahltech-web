import type { ReactNode } from "react";

/**
 * Section heading with the ornamental gold rule beneath it.
 *
 * `level` exists because heading rank is a document-structure decision, not a
 * styling one — a section inside an article needs h3 while the same visual
 * treatment on a landing page needs h2.
 */
export function SectionHeading({
  children,
  level = 2,
  eyebrow,
  id,
  className = "",
}: {
  children: ReactNode;
  level?: 2 | 3;
  eyebrow?: string;
  id?: string;
  className?: string;
}) {
  const Tag = level === 2 ? "h2" : "h3";

  return (
    <div className={className}>
      {eyebrow ? (
        <p className="text-sm font-semibold text-text-muted">{eyebrow}</p>
      ) : null}
      <Tag id={id} className="mt-2xs text-section text-balance text-text">
        {children}
      </Tag>
      {/* Ornamental only: at 1.59:1 the rule cannot carry meaning. */}
      <span className="mt-xs heading-rule" aria-hidden="true" />
    </div>
  );
}
