"use client";

import { useMemo, useState } from "react";

import {
  compileFormula,
  displayedRange,
  formatUsd,
  formatUsdExact,
  restBands,
  rangeOverBands,
  totalFormula,
  type Band,
} from "@/lib/dashboards/v2/model";

import type { ModelConfig } from "@/lib/dashboards/v2/schema";

import { EvidenceLabel, Labelled } from "./EvidenceLabel";
import { RangeSlider } from "./RangeSlider";

type Copy = {
  caption: string;
  liveCaption: string;
  subline: string;
  labelsLink: string;
  resetLabel: string;
  narrowedNote: string;
  nowLabel: string;
  lowLabel: string;
  highLabel: string;
  perYear: string;
  computedLabel: string;
  termsHeading: string;
  typeLabel: string;
  typeHint: string;
};

const rangeText = (b: Band, fmt: (n: number) => string) =>
  b.low === b.high ? fmt(b.low) : `${fmt(b.low)} to ${fmt(b.high)}`;

/**
 * Sections two and three of the page: the number, and the assumptions that
 * make it. One component because they share one piece of state; the headline
 * is the model's output and must move when a slider does.
 *
 * At rest the headline and the readouts show the range printed in the
 * letter, exactly. Once the visitor moves a slider they show the model's
 * live output for their bands, rounded to the config's step. The formula box
 * always shows the same output unrounded, to the dollar, and split into the
 * model's terms, so a reader checking the arithmetic finds every figure they
 * would compute themselves. Reset returns to rest. Server-rendered at rest, so
 * the letter's figure is on screen before any JavaScript runs.
 *
 * Screen readers hear the estimate once per interaction, when a handle is
 * released or a figure is entered, not at every step of a drag.
 */
export function CalibrationModel({
  model,
  copy,
}: {
  model: ModelConfig;
  copy: Copy;
}) {
  const tree = useMemo(
    () => compileFormula(totalFormula(model.terms)),
    [model.terms],
  );
  const termTrees = useMemo(
    () => model.terms.map((t) => ({ ...t, tree: compileFormula(t.formula) })),
    [model.terms],
  );
  const initial = useMemo(() => restBands(model.sliders), [model.sliders]);
  const [bands, setBands] = useState<Record<string, Band>>(initial);
  const [touched, setTouched] = useState(false);
  const [announced, setAnnounced] = useState("");

  const computed = rangeOverBands(tree, model, bands);
  const shown = displayedRange(
    touched,
    computed,
    model.letterRange,
    model.roundTo,
  );
  const text = rangeText(shown.range, formatUsd);

  const update = (id: string, next: Band) => {
    setBands((prev) => ({ ...prev, [id]: next }));
    setTouched(true);
  };
  const commit = () =>
    setAnnounced(`${copy.nowLabel}: ${text} ${copy.perYear}`);
  const reset = () => {
    setBands(initial);
    setTouched(false);
    setAnnounced(
      `${copy.nowLabel}: ${rangeText(model.letterRange, formatUsd)} ${copy.perYear}`,
    );
  };

  const resetBlock = (className: string) => (
    <div className={className}>
      <p className="text-sm text-text">{copy.narrowedNote}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-xs min-h-11 w-full rounded-md border border-border px-sm text-sm font-semibold text-text hover:bg-surface sm:w-auto"
      >
        {copy.resetLabel}
      </button>
    </div>
  );

  return (
    <>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announced}
      </p>

      <section aria-labelledby="estimate-caption" className="mt-xl">
        <p id="estimate-caption" className="text-base text-text-muted">
          {shown.live ? copy.liveCaption : copy.caption}
        </p>
        <p
          id="estimate-figure"
          className="mt-2xs font-display text-display text-balance text-text tabular-nums"
          data-model-low={computed.low}
          data-model-high={computed.high}
        >
          {shown.range.low === shown.range.high ? (
            formatUsd(shown.range.low)
          ) : (
            <>
              {formatUsd(shown.range.low)}{" "}
              <span className="text-text-muted">to</span>{" "}
              {formatUsd(shown.range.high)}
            </>
          )}{" "}
          <span className="font-sans text-lg font-normal text-text-muted">
            {copy.perYear}
          </span>
        </p>
        <p className="mt-xs flex flex-wrap items-center gap-x-sm gap-y-2xs">
          <EvidenceLabel label="ASSUMED" />
          <a
            href="#labels"
            className="text-sm text-text-muted link-accent underline"
          >
            {copy.labelsLink}
          </a>
        </p>
        <p className="mt-sm font-display text-xl text-text">{copy.subline}</p>
      </section>

      <section aria-labelledby="model-heading" className="mt-xl lg:mt-2xl">
        <h2 id="model-heading" className="text-section text-text">
          {model.heading}
        </h2>
        <span className="mt-xs heading-rule" aria-hidden="true" />
        <p className="mt-sm max-w-prose text-text-muted">{model.intro}</p>

        {/* Desktop: controls on the left, the live estimate in a panel that
            stays beside them while a slider is dragged with a mouse. Below
            the lg breakpoint this collapses to one column with a pinned bar. */}
        <div className="mt-sm lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-2xl">
          <div>
            <div className="sticky top-0 z-10 -mx-sm border-b border-divider bg-bg/95 px-sm py-xs backdrop-blur-sm lg:hidden print:hidden">
              <p className="flex items-baseline justify-between gap-sm">
                <span className="text-sm text-text-muted">{copy.nowLabel}</span>
                <span className="font-display text-lg text-text tabular-nums">
                  {text}{" "}
                  <span className="font-sans text-sm text-text-muted">
                    {copy.perYear}
                  </span>
                </span>
              </p>
            </div>

            <div className="mt-sm space-y-lg">
              {model.sliders.map((slider) => (
                <div key={slider.id}>
                  <RangeSlider
                    label={slider.label}
                    format={slider.format}
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={
                      bands[slider.id] ?? { low: slider.min, high: slider.max }
                    }
                    onChange={(next) => update(slider.id, next)}
                    onCommit={commit}
                    presets={slider.presets}
                    caption={slider.caption}
                    lowLabel={copy.lowLabel}
                    highLabel={copy.highLabel}
                    typeLabel={copy.typeLabel}
                    typeHint={copy.typeHint}
                    describedBy={`basis-${slider.id}`}
                  />
                  <div
                    id={`basis-${slider.id}`}
                    className="mt-2xs max-w-prose text-sm"
                  >
                    <p className="text-text-muted">
                      <Labelled text={slider.basis} />
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {touched ? resetBlock("mt-lg lg:hidden print:hidden") : null}

            <div className="mt-lg rounded-lg border border-border bg-surface p-sm sm:p-md">
              <p className="overflow-x-auto font-mono text-sm leading-relaxed text-text">
                {model.formulaText}
              </p>
              <p className="mt-xs text-sm text-text-muted">{model.plainText}</p>

              <dl
                aria-label={copy.termsHeading}
                className="mt-sm border-t border-divider pt-sm text-sm"
              >
                {termTrees.map((term) => (
                  <div
                    key={term.id}
                    className="flex items-baseline justify-between gap-sm py-3xs"
                  >
                    <dt className="text-text-muted">{term.label}</dt>
                    <dd className="shrink-0 text-end whitespace-nowrap text-text tabular-nums">
                      {rangeText(
                        rangeOverBands(term.tree, model, bands),
                        formatUsdExact,
                      )}
                    </dd>
                  </div>
                ))}
                <div className="mt-2xs flex items-baseline justify-between gap-sm border-t border-divider pt-xs">
                  <dt className="font-semibold text-text">
                    {copy.computedLabel}:
                  </dt>
                  <dd
                    id="estimate-computed"
                    className="shrink-0 text-end font-semibold whitespace-nowrap text-text tabular-nums"
                  >
                    {rangeText(computed, formatUsdExact)}
                  </dd>
                </div>
              </dl>

              {model.constants.length > 0 ? (
                <ul className="mt-sm space-y-2xs border-t border-divider pt-sm text-sm text-text-muted">
                  {model.constants.map((c) => (
                    <li key={c.id}>
                      <Labelled text={c.text} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <aside
            aria-label={copy.nowLabel}
            className="sticky top-lg hidden rounded-lg border border-border p-md lg:block print:hidden"
          >
            <p className="text-sm text-text-muted">{copy.nowLabel}</p>
            <p className="mt-2xs font-display text-3xl text-balance text-text tabular-nums">
              {text}
            </p>
            <p className="text-sm text-text-muted">{copy.perYear}</p>
            <p className="mt-2xs text-xs text-text-muted tabular-nums">
              {copy.computedLabel}: {rangeText(computed, formatUsdExact)}
            </p>
            <p className="mt-sm">
              <EvidenceLabel label="ASSUMED" />
            </p>
            {touched ? resetBlock("mt-md border-t border-divider pt-md") : null}
          </aside>
        </div>
      </section>
    </>
  );
}
