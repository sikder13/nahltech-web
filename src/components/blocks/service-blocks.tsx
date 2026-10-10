import Link from "next/link";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";
import { Prose } from "@/components/ui/Prose";
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
          <ButtonLink
            href={action.href}
            external={action.external}
            className="mt-md"
          >
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
    <section className="bg-surface">
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

/**
 * The open lab notebook.
 *
 * Set as a record rather than a marketing panel: monospace, ruled top and
 * bottom, tabular figures. This is the verifiability differentiator, so it
 * reads like something written down rather than something claimed. No metric
 * table yet — per-client measurements are not ours to publish.
 */
export function MeasurementBlock({
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
        <div className="mt-lg max-w-prose border-y border-text py-md">
          <p className="font-mono text-sm leading-relaxed text-text tabular-nums">
            {body}
          </p>
        </div>
      </FadeIn>
    </section>
  );
}

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
 * A titled band of prose on a service page: a paragraph, a list, or both.
 *
 * For sections a page's approved copy adds beyond the shared anatomy. A
 * segment whose key has no destination renders as plain text, the same rule
 * the market pages follow: the words stay, an anchor with nowhere to go does
 * not.
 */
export function ServiceProseSection({
  heading,
  body,
  items,
  hrefs = {},
  tinted = false,
}: {
  heading: string;
  body?: readonly TextSegment[];
  items?: readonly string[];
  hrefs?: Readonly<Record<string, string>>;
  tinted?: boolean;
}) {
  return (
    <section className={tinted ? "bg-surface" : undefined}>
      <div className={shell}>
        <FadeIn>
          <SectionHeading>{heading}</SectionHeading>
          <Prose className="mt-md">
            {body ? (
              <p>
                {body.map((segment) => {
                  const href = segment.link ? hrefs[segment.link] : undefined;
                  if (!href) return segment.text;
                  // Internal hrefs go through next/link; anything else is a
                  // plain anchor, the same split the article routes make.
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
                })}
              </p>
            ) : null}
            {items ? (
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </Prose>
        </FadeIn>
      </div>
    </section>
  );
}
