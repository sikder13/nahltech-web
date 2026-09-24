"use client";

import { useMemo, useState } from "react";

import {
  compileFormula,
  displayedRange,
  formatUsd,
  fullBands,
  rangeOverBands,
  type Band,
} from "@/lib/dashboards/model";

import type { ModelConfig } from "@/lib/dashboards/schema";

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
};

/**
 * Sections two and three of the page: the number, and the assumptions that
 * make it. One component because they share one piece of state; the hero is
 * the model's output and must move when a slider does.
 *
 * At rest the headline and the readout show the range printed in the
 * letter, exactly. Only when the visitor moves a slider do they switch to
 * the model's live output for their bands. Reset returns to rest.
 * Server-rendered at rest, so the letter's figure is on screen before any
 * JavaScript runs.
 */
export function CalibrationModel({
  model,
  copy,
}: {
  model: ModelConfig;
  copy: Copy;
}) {
  const tree = useMemo(() => compileFormula(model.formula), [model.formula]);
  const initial = useMemo(() => fullBands(model.sliders), [model.sliders]);
  const [bands, setBands] = useState<Record<string, Band>>(initial);
  const [touched, setTouched] = useState(false);

  const computed = rangeOverBands(tree, model, bands);
  const shown = displayedRange(
    touched,
    computed,
    model.letterRange,
    model.roundTo,
  );
  const { low, high } = shown.range;
  const figure = low === high ? formatUsd(low) : null;
  const text = figure ?? `${formatUsd(low)} to ${formatUsd(high)}`;

  const update = (id: string, next: Band) => {
    setBands((prev) => ({ ...prev, [id]: next }));
    setTouched(true);
  };
  const reset = () => {
    setBands(initial);
    setTouched(false);
  };

  return (
    <>
      <section aria-labelledby="estimate-caption" className="mt-xl">
        <p id="estimate-caption" className="text-base text-text-muted">
          {shown.live ? copy.liveCaption : copy.caption}
        </p>
        <p
          className="mt-2xs font-display text-display text-balance text-text tabular-nums"
          aria-live="polite"
          aria-atomic="true"
          data-model-low={computed.low}
          data-model-high={computed.high}
        >
          {figure ?? (
            <>
              {formatUsd(low)} <span className="text-text-muted">to</span>{" "}
              {formatUsd(high)}
            </>
          )}{" "}
          <span className="font-sans text-lg font-normal text-text-muted">
            {copy.perYear}
          </span>
        </p>
        <p className="mt-sm flex flex-wrap items-center gap-x-sm gap-y-2xs">
          <EvidenceLabel label="ASSUMED" />
          <a
            href="#labels"
            className="text-sm text-text-muted link-accent underline"
          >
            {copy.labelsLink}
          </a>
        </p>
        <p className="mt-md font-display text-xl text-text">{copy.subline}</p>
      </section>

      <section aria-labelledby="model-heading" className="mt-2xl">
        <h2 id="model-heading" className="text-section text-text">
          {model.heading}
        </h2>
        <span className="mt-sm heading-rule" aria-hidden="true" />
        <p className="mt-md max-w-prose text-text-muted">{model.intro}</p>

        {/* Keeps the answer in view while a thumb is being dragged on a phone,
            where the headline has long since scrolled away. */}
        <div className="sticky top-0 z-10 -mx-sm mt-md border-b border-divider bg-bg/95 px-sm py-xs backdrop-blur-sm">
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

        <div className="mt-md space-y-xl">
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
                lowLabel={copy.lowLabel}
                highLabel={copy.highLabel}
                describedBy={`basis-${slider.id}`}
              />
              <p
                id={`basis-${slider.id}`}
                className="mt-2xs max-w-prose text-sm text-text-muted"
              >
                <Labelled text={slider.basis} />
              </p>
            </div>
          ))}
        </div>

        {touched ? (
          <div className="mt-lg flex flex-wrap items-center gap-sm">
            <p className="text-sm text-text">{copy.narrowedNote}</p>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-border px-sm py-2xs text-sm font-semibold text-text hover:bg-surface"
            >
              {copy.resetLabel}
            </button>
          </div>
        ) : null}

        <div className="mt-xl rounded-lg border border-border bg-surface p-md">
          <p className="overflow-x-auto font-mono text-sm leading-relaxed text-text">
            {model.formulaText}
          </p>
          <p className="mt-sm text-sm text-text-muted">{model.plainText}</p>
          {model.constants.length > 0 ? (
            <ul className="mt-sm space-y-2xs text-sm text-text-muted">
              {model.constants.map((c) => (
                <li key={c.id}>
                  <Labelled text={c.text} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </>
  );
}
