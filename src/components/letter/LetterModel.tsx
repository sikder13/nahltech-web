"use client";

import { useState } from "react";

import { EvidenceLabel } from "@/components/dashboard/v2/EvidenceLabel";
import { RangeSlider } from "@/components/dashboard/v2/RangeSlider";
import {
  computeExample,
  openingBands,
  resultSentence,
} from "@/lib/letter-pages/model";

import type { Band, EvidenceLabel as Tag } from "@/lib/dashboards/v2/model";
import type { ExampleModel } from "@/lib/letter-pages/model";

type Input = ExampleModel["inputs"][number] & {
  label: string;
  stated: string;
  tag: Tag;
  reason?: string;
  step: number;
};

/**
 * The worked example: a few inputs as sliders and one sentence that follows
 * them.
 *
 * The sliders are the dashboards' own, so a reader who has seen one of those
 * pages finds the same control here. Each opens on the band the proposal
 * states; under it sits that band in words, its evidence label and the
 * reason for it, which do not move, so the reader can always see what we
 * assumed against what they have set.
 *
 * Rendered on the server at the opening bands, so the stated figures are on
 * screen before any script runs. Screen readers hear the sentence once per
 * interaction, when a handle is released or a figure is entered, not at
 * every step of a drag.
 */
export function LetterModel({
  example,
  labels,
}: {
  example: Omit<ExampleModel, "inputs"> & {
    title: string;
    inputs: readonly Input[];
    context: string;
  };
  labels: {
    lowLabel: string;
    highLabel: string;
    typeLabel: string;
    typeHint: string;
  };
}) {
  const [bands, setBands] = useState<Record<string, Band>>(() =>
    openingBands(example),
  );
  const [announced, setAnnounced] = useState("");

  const sentence = resultSentence(
    example.result,
    computeExample(example, bands),
  );

  return (
    <div className="mt-lg">
      <h3 className="font-display text-2xl text-text">{example.title}</h3>

      <div className="mt-md space-y-lg">
        {example.inputs.map((input) => (
          <div key={input.id}>
            <RangeSlider
              label={input.label}
              format={input.format}
              min={input.min}
              max={input.max}
              step={input.step}
              value={bands[input.id]}
              onChange={(next) =>
                setBands((current) => ({ ...current, [input.id]: next }))
              }
              onCommit={() => setAnnounced(sentence)}
              presets={[]}
              lowLabel={labels.lowLabel}
              highLabel={labels.highLabel}
              typeLabel={labels.typeLabel}
              typeHint={labels.typeHint}
            />
            <p className="mt-2xs text-sm text-text-muted">
              {input.stated} <EvidenceLabel label={input.tag} />
              {input.reason ? ` ${input.reason}` : null}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-lg rounded-lg border-2 border-text p-md font-display text-xl text-text">
        {sentence}
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announced}
      </p>

      <p className="mt-sm text-base text-text">
        <EvidenceLabel label="BENCHMARK" /> {example.context}
      </p>
    </div>
  );
}
