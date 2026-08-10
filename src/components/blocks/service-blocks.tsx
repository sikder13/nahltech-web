import { ButtonLink } from "@/components/ui/ButtonLink";
import { ImageSlot } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";

import type { CtaAction } from "./CtaBlock";

const shell = "mx-auto max-w-(--container-page) px-sm py-2xl";

/** Names the problem before offering anything. First block on a service page. */
export function ProblemStatement({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  return (
    <section className={shell}>
      <FadeIn>
        <SectionHeading>{heading}</SectionHeading>
        <p className="mt-md max-w-prose text-lg text-text-muted">{body}</p>
      </FadeIn>
    </section>
  );
}

/** Shows the work rather than describing it. Holds a screenshot or diagram. */
export function DemoBlock({
  heading,
  body,
  imageLabel,
}: {
  heading: string;
  body: string;
  imageLabel: string;
}) {
  return (
    <section className="border-y border-divider bg-surface">
      <div className={shell}>
        <FadeIn>
          <SectionHeading>{heading}</SectionHeading>
          <div className="mt-lg grid items-center gap-lg md:grid-cols-2">
            <p className="text-text-muted">{body}</p>
            <ImageSlot label={imageLabel} />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export type Step = { label: string; body: string };

/**
 * The method as an ordered list. Vertical here, unlike the home page's
 * horizontal strip: on a service page the steps carry detail, so they need
 * the width.
 */
export function MethodSteps({
  heading,
  steps,
}: {
  heading: string;
  steps: readonly Step[];
}) {
  return (
    <section className={shell}>
      <FadeIn>
        <SectionHeading>{heading}</SectionHeading>
        <ol className="mt-lg max-w-prose space-y-md">
          {steps.map((step, index) => (
            <li key={step.label} className="flex gap-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-text">
                {index + 1}
              </span>
              <div>
                <h3 className="text-base font-semibold text-text">
                  {step.label}
                </h3>
                <p className="mt-3xs text-sm text-text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </FadeIn>
    </section>
  );
}

/**
 * One price, stated plainly. No tiers, no "contact us for pricing" — the
 * published price is part of the positioning.
 */
export function PriceCard({
  heading,
  startingAtLabel,
  amount,
  unit,
  note,
  action,
}: {
  heading: string;
  startingAtLabel?: string;
  amount: string;
  unit: string;
  note: string;
  action: CtaAction;
}) {
  return (
    <section className={shell}>
      <FadeIn>
        <SectionHeading>{heading}</SectionHeading>
        <div className="mt-lg max-w-(--container-card) rounded-lg border border-border p-lg">
          {startingAtLabel ? (
            <p className="text-sm text-text-muted">{startingAtLabel}</p>
          ) : null}
          <p className="mt-3xs flex items-baseline gap-2xs">
            <span className="text-3xl font-bold tracking-tight text-text">
              {amount}
            </span>
            <span className="text-sm text-text-muted">{unit}</span>
          </p>
          <p className="mt-sm text-sm text-text-muted">{note}</p>
          <ButtonLink href={action.href} className="mt-md">
            {action.label}
          </ButtonLink>
        </div>
      </FadeIn>
    </section>
  );
}

export function DeliverablesList({
  heading,
  items,
}: {
  heading: string;
  items: readonly string[];
}) {
  return (
    <section className="border-y border-divider bg-surface">
      <div className={shell}>
        <FadeIn>
          <SectionHeading>{heading}</SectionHeading>
          <ul className="mt-lg grid max-w-(--container-measure) gap-sm sm:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="flex gap-2xs text-sm text-text">
                <Icon name="check" className="mt-px size-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}

export type Measurement = { metric: string; method: string };

/**
 * The open lab notebook: every metric paired with the method used to obtain
 * it. This is the verifiability differentiator, so it is deliberately styled
 * like a record rather than a marketing panel — monospace, ruled rows, no
 * emphasis colour. A claim with no stated method has no place in this table.
 */
export function MeasurementBlock({
  heading,
  intro,
  metricLabel,
  methodLabel,
  rows,
}: {
  heading: string;
  intro: string;
  metricLabel: string;
  methodLabel: string;
  rows: readonly Measurement[];
}) {
  return (
    <section className={shell}>
      <FadeIn>
        <SectionHeading>{heading}</SectionHeading>
        <p className="mt-md max-w-prose text-text-muted">{intro}</p>

        <div className="mt-lg overflow-x-auto rounded-lg border border-divider">
          <table className="w-full border-collapse text-start font-mono text-sm">
            <caption className="sr-only">{heading}</caption>
            <thead>
              <tr className="border-b border-divider bg-surface">
                <th scope="col" className="px-sm py-2xs text-start text-text">
                  {metricLabel}
                </th>
                <th scope="col" className="px-sm py-2xs text-start text-text">
                  {methodLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.metric} className="border-b border-divider">
                  <th
                    scope="row"
                    className="px-sm py-2xs text-start font-normal text-text"
                  >
                    {row.metric}
                  </th>
                  <td className="px-sm py-2xs text-text-muted">{row.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FadeIn>
    </section>
  );
}
