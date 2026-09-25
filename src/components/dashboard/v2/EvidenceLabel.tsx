import { Fragment, type ReactNode } from "react";

import {
  evidenceLabels,
  type EvidenceLabel as Label,
} from "@/lib/dashboards/v2/model";

/**
 * The three evidence labels, drawn so they read without colour.
 *
 * The design system forbids gold from carrying meaning (1.59:1 on white), so
 * the labels are told apart by line alone, borrowing the convention of an
 * engineering drawing, which is the document an owner of a molding shop
 * already reads fluently:
 *
 *   OBSERVED   solid ink block      a fact, drawn in solid line
 *   BENCHMARK  solid outline        a published reference, boxed and cited
 *   ASSUMED    dashed outline       provisional, drawn in pencil, to be moved
 *
 * All three are text in #111 or on #111, so every label clears AA contrast
 * on its own. They sit inline at the end of the figure they qualify, the way
 * a tolerance note sits beside a dimension.
 */
const styles: Record<Label, string> = {
  OBSERVED: "bg-text text-bg border border-text",
  BENCHMARK: "bg-bg text-text border border-text",
  ASSUMED: "bg-bg text-text border border-dashed border-text",
};

export function EvidenceLabel({ label }: { label: Label }) {
  return (
    <span
      className={`inline-block rounded-sm px-[0.5em] py-[0.22em] align-[0.12em] text-[0.66rem] leading-none font-semibold tracking-[0.08em] whitespace-nowrap ${styles[label]}`}
    >
      {label}
    </span>
  );
}

const MARKER = /\[\[(OBSERVED|BENCHMARK|ASSUMED)\]\]/g;

/**
 * Renders config prose, turning `[[ASSUMED]]` markers into labels.
 *
 * The space before a marker becomes a non-breaking one, so a label never
 * wraps onto a line by itself, orphaned from the figure it belongs to.
 */
export function Labelled({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(MARKER)) {
    const index = match.index ?? 0;
    const before = text.slice(last, index).replace(/ $/, "\u00a0");
    out.push(<Fragment key={`t${index}`}>{before}</Fragment>);
    out.push(<EvidenceLabel key={`l${index}`} label={match[1] as Label} />);
    last = index + match[0].length;
  }
  out.push(<Fragment key="end">{text.slice(last)}</Fragment>);
  return <>{out}</>;
}

export { evidenceLabels };
