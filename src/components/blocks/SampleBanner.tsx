/**
 * Disclosure panel for an artifact whose client is fictional.
 *
 * Rendered above the h1, before any number appears. That placement is the
 * whole point: these documents contain revenue figures, ROI grids and payback
 * periods, and a reader who meets those before the disclosure has already been
 * misled — even if a footnote corrects it later. The banner has to be
 * impossible to miss and impossible to reach a figure without passing.
 *
 * A panel rather than a blockquote, because a blockquote reads as an aside the
 * eye is trained to skip. Surface fill and a hairline border make it a
 * different kind of object from the prose around it.
 *
 * Not `role="note"` or an alert: it is static disclosure, not a live region,
 * and announcing it as an alert would interrupt a screen reader mid-heading.
 * The visible label carries the meaning, and `aria-labelledby` binds it to the
 * region so it is announced as a named landmark on the way in.
 */
export function SampleBanner({
  label,
  lead,
  body,
  id = "sample-disclosure",
}: {
  label: string;
  lead: string;
  body: string;
  id?: string;
}) {
  return (
    <aside
      aria-labelledby={`${id}-label`}
      className="rounded-lg border border-border bg-surface p-md"
    >
      <p id={`${id}-label`} className="font-mono caption">
        {label}
      </p>
      <p className="mt-2xs text-sm text-text">
        <strong className="font-semibold">{lead}</strong> {body}
      </p>
    </aside>
  );
}
