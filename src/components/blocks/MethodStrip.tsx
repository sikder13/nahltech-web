import { FadeIn } from "@/components/ui/FadeIn";
import { HexOutline } from "@/components/ui/Hex";

export type MethodStep = {
  label: string;
  body: string;
};

/**
 * The diagnosis-first method, as four honeycomb cells.
 *
 * An ordered list, because the sequence is the point: measure before
 * building. This is the one place on the site that carries step numerals —
 * they are earned here and nowhere else, since Observe → Analyze → Quantify →
 * Build is a genuine process rather than an arbitrary list.
 *
 * The numerals sit inside flat-top hexagons, the orientation that tiles in a
 * straight horizontal row, so the four cells read as a strip of comb rather
 * than as four more cards. No icons here: the
 * numeral and the cell already do the work, and adding a glyph would collapse
 * this back into the icon-title-text pattern used everywhere else.
 */
export function MethodStrip({
  heading,
  steps,
  id = "method",
}: {
  heading: string;
  steps: readonly MethodStep[];
  id?: string;
}) {
  return (
    <section id={id} aria-labelledby="method-heading" className="bg-surface">
      <div className="mx-auto max-w-(--container-page) px-sm py-2xl">
        <FadeIn>
          <h2
            id="method-heading"
            className="max-w-prose text-section text-balance text-text"
          >
            {heading}
          </h2>
          <span className="mt-xs heading-rule" aria-hidden="true" />
        </FadeIn>

        <ol className="mt-lg grid gap-lg sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.label}>
              <FadeIn delay={index * 0.06}>
                <span className="relative flex size-12 items-center justify-center">
                  <HexOutline
                    orientation="flat"
                    className="absolute inset-0 size-full text-border"
                    strokeWidth={1}
                  />
                  <span className="relative font-mono text-sm font-semibold text-text tabular-nums">
                    {index + 1}
                  </span>
                </span>

                <h3 className="mt-sm text-base font-semibold text-text">
                  {step.label}
                </h3>
                <p className="mt-2xs text-sm text-text-muted">{step.body}</p>
              </FadeIn>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
