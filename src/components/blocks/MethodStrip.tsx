import { FadeIn } from "@/components/ui/FadeIn";
import { Icon, type IconName } from "@/components/ui/Icon";

export type MethodStep = {
  icon: IconName;
  label: string;
  body: string;
};

/**
 * The diagnosis-first method, as four ordered steps.
 *
 * An ordered list, because the sequence is the point: measure before
 * building. The step numbers come from the list itself rather than being
 * baked into the copy, so reordering is a data change.
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
    <section
      id={id}
      aria-labelledby="method-heading"
      className="border-y border-divider bg-surface"
    >
      <div className="mx-auto max-w-(--container-page) px-sm py-2xl">
        <FadeIn>
          <h2
            id="method-heading"
            className="max-w-prose text-2xl font-bold tracking-tight text-balance text-text"
          >
            {heading}
          </h2>
          <span className="mt-xs heading-rule" aria-hidden="true" />

          <ol className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.label} className="relative">
                <div className="flex items-center gap-2xs">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-text">
                    {index + 1}
                  </span>
                  <Icon name={step.icon} className="size-5 text-text-muted" />
                </div>
                <h3 className="mt-sm text-base font-semibold text-text">
                  {step.label}
                </h3>
                <p className="mt-2xs text-sm text-text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </FadeIn>
      </div>
    </section>
  );
}
