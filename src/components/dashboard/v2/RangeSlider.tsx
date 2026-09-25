"use client";

import { useId, useRef, useState } from "react";

import {
  formatSliderValue,
  parseTypedValue,
  spokenSliderValue,
  type Band,
  type SliderFormat,
} from "@/lib/dashboards/v2/model";

import styles from "./RangeSlider.module.css";

type Props = {
  label: string;
  format: SliderFormat;
  min: number;
  max: number;
  step: number;
  value: Band;
  onChange: (next: Band) => void;
  /** Fired when an interaction ends: handle released, key up, figure typed, preset. */
  onCommit: () => void;
  presets: readonly { label: string; low: number; high: number }[];
  /** A short instruction set directly under the track, above any presets. */
  caption?: string;
  lowLabel: string;
  highLabel: string;
  typeLabel: string;
  typeHint: string;
  describedBy?: string;
};

/**
 * One assumption as a band: two handles on one track.
 *
 * The handles may meet, which is how an owner says "I know this figure
 * exactly". While the low handle sits in the upper half of the track it is
 * stacked on top, so that when both are pushed to the maximum it can still
 * be grabbed and pulled back down.
 *
 * Two quicker ways to say "I know this figure", for a reader who does:
 * tapping the printed value opens a field to type it (both handles close on
 * it), and a named preset sets the band in one tap. Typed figures are kept
 * exactly, not snapped to the slider's step, so the model is correct to the
 * dollar for whatever was typed.
 */
export function RangeSlider({
  label,
  format,
  min,
  max,
  step,
  value,
  onChange,
  onCommit,
  presets,
  caption,
  lowLabel,
  highLabel,
  typeLabel,
  typeHint,
  describedBy,
}: Props) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const span = max - min;
  const pct = (v: number) => ((v - min) / span) * 100;
  const lowOnTop = pct(value.low) > 50;

  const shown =
    value.low === value.high
      ? formatSliderValue(format, value.low)
      : `${formatSliderValue(format, value.low)} to ${formatSliderValue(format, value.high)}`;

  const openEditor = () => {
    setDraft(
      value.low === value.high ? formatSliderValue(format, value.low) : "",
    );
    setInvalid(false);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const apply = () => {
    const typed = parseTypedValue(format, draft, min, max);
    if (typed === null) {
      setInvalid(true);
      return;
    }
    onChange({ low: typed, high: typed });
    setEditing(false);
    onCommit();
  };

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={describedBy}
    >
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-sm">
        <span id={`${id}-label`} className="font-semibold text-text">
          {label}
        </span>
        {editing ? (
          <span className="flex items-center gap-2xs">
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              aria-label={typeLabel.replace("{label}", label)}
              aria-invalid={invalid}
              aria-describedby={`${id}-hint`}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setInvalid(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") apply();
                if (e.key === "Escape") setEditing(false);
              }}
              onBlur={() => (draft.trim() ? apply() : setEditing(false))}
              className={`w-32 rounded-md border px-xs py-3xs text-end font-display text-lg text-text tabular-nums ${invalid ? "border-2 border-text" : "border-border"}`}
            />
            <span id={`${id}-hint`} className="sr-only">
              {typeHint}
            </span>
          </span>
        ) : (
          <button
            type="button"
            onClick={openEditor}
            aria-label={`${typeLabel.replace("{label}", label)}. ${shown}`}
            className="ms-auto rounded-sm font-display text-xl whitespace-nowrap text-text tabular-nums underline decoration-divider decoration-dotted underline-offset-4 hover:decoration-text"
          >
            {shown}
          </button>
        )}
      </div>
      <div className={`${styles.track} print:hidden`}>
        <div className={styles.rail} aria-hidden="true" />
        <div
          className={styles.band}
          aria-hidden="true"
          style={{
            left: `${pct(value.low)}%`,
            right: `${100 - pct(value.high)}%`,
          }}
        />
        {(["low", "high"] as const).map((end) => (
          <input
            key={end}
            type="range"
            className={styles.input}
            style={{ zIndex: (end === "low") === lowOnTop ? 3 : 2 }}
            min={min}
            max={max}
            step={step}
            value={value[end]}
            aria-label={`${label}, ${end === "low" ? lowLabel : highLabel}`}
            aria-valuetext={spokenSliderValue(format, value[end])}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange(
                end === "low"
                  ? { low: Math.min(v, value.high), high: value.high }
                  : { low: value.low, high: Math.max(v, value.low) },
              );
            }}
            onPointerUp={onCommit}
            onKeyUp={onCommit}
          />
        ))}
      </div>
      <div
        className="flex justify-between text-xs text-text-muted print:hidden"
        aria-hidden="true"
      >
        <span>{formatSliderValue(format, min)}</span>
        <span>{formatSliderValue(format, max)}</span>
      </div>
      {caption ? (
        <p className="mt-2xs text-sm font-semibold text-text">{caption}</p>
      ) : null}
      {presets.length > 0 ? (
        <div className="mt-2xs flex flex-wrap gap-xs print:hidden">
          {presets.map((preset) => {
            const active =
              value.low === preset.low && value.high === preset.high;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  onChange({ low: preset.low, high: preset.high });
                  onCommit();
                }}
                className={`min-h-11 rounded-md border px-sm text-sm font-semibold ${active ? "border-text bg-text text-bg" : "border-border text-text hover:bg-surface"}`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
