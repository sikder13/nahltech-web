import type { ReactNode } from "react";

/**
 * The panel a data report's method section sits in.
 *
 * Same surface-and-hairline treatment as the sample-engagement disclosure,
 * for the same reason: it marks a block as a different kind of statement from
 * the prose around it. Here the statement is the report's integrity contract
 * — corpus, what the tool measures, what the data is not — and it is placed
 * before any number so a reader meets the limits before the findings rather
 * than after them.
 *
 * A plain container, not an `<aside>`. The section carries an h2 that the
 * table of contents links to and that belongs in the document outline;
 * wrapping it in a complementary landmark would move it out of the main flow
 * for a screen reader while leaving the contents page pointing into it.
 *
 * The first-child margin reset stops `Prose`'s `h2 { margin-top }` from
 * pushing the heading away from the top of its own panel.
 */
export function MethodBox({ children }: { children: ReactNode }) {
  return (
    <div className="mt-xl rounded-lg border border-border bg-surface p-md [&>*:first-child]:mt-0">
      {children}
    </div>
  );
}
