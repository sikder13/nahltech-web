"use client";

import { useId } from "react";

import {
  formatSliderValue,
  spokenSliderValue,
  type Band,
  type SliderFormat,
} from "@/lib/dashboards/model";

import styles from "./RangeSlider.module.css";

type Props = {
  label: string;
  format: SliderFormat;
  min: number;
  max: number;
  step: number;
  value: Band;
  onChange: (next: Band) => void;
  lowLabel: string;
  highLabel: string;
  describedBy?: string;
};

/**
 * One assumption as a band: two handles on one track.
 *
 * The handles may meet, which is how an owner says "I know this figure
 * exactly". While the low handle sits in the upper half of the track it is
 * stacked on top, so that when both are pushed to the maximum it can still
 * be grabbed and pulled back down.
 */
export function RangeSlider({
  label,
  format,
  min,
  max,
  step,
  value,
  onChange,
  lowLabel,
  highLabel,
  describedBy,
}: Props) {
  const id = useId();
  const span = max - min;
  const pct = (v: number) => ((v - min) / span) * 100;
  const lowOnTop = pct(value.low) > 50;

  const shown =
    value.low === value.high
      ? formatSliderValue(format, value.low)
      : `${formatSliderValue(format, value.low)} to ${formatSliderValue(format, value.high)}`;

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={describedBy}
    >
      <div className="flex items-baseline justify-between gap-sm">
        <span id={`${id}-label`} className="font-semibold text-text">
          {label}
        </span>
        <output
          className="font-display text-xl text-text tabular-nums"
          aria-live="off"
        >
          {shown}
        </output>
      </div>
      <div className={styles.track}>
        <div className={styles.rail} aria-hidden="true" />
        <div
          className={styles.band}
          aria-hidden="true"
          style={{
            left: `${pct(value.low)}%`,
            right: `${100 - pct(value.high)}%`,
          }}
        />
        <input
          type="range"
          className={styles.input}
          style={{ zIndex: lowOnTop ? 3 : 2 }}
          min={min}
          max={max}
          step={step}
          value={value.low}
          aria-label={`${label}, ${lowLabel}`}
          aria-valuetext={spokenSliderValue(format, value.low)}
          onChange={(e) => {
            const low = Math.min(Number(e.target.value), value.high);
            onChange({ low, high: value.high });
          }}
        />
        <input
          type="range"
          className={styles.input}
          style={{ zIndex: lowOnTop ? 2 : 3 }}
          min={min}
          max={max}
          step={step}
          value={value.high}
          aria-label={`${label}, ${highLabel}`}
          aria-valuetext={spokenSliderValue(format, value.high)}
          onChange={(e) => {
            const high = Math.max(Number(e.target.value), value.low);
            onChange({ low: value.low, high });
          }}
        />
      </div>
      <div
        className="flex justify-between text-xs text-text-muted"
        aria-hidden="true"
      >
        <span>{formatSliderValue(format, min)}</span>
        <span>{formatSliderValue(format, max)}</span>
      </div>
    </div>
  );
}
