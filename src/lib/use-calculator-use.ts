"use client";

import { useCallback } from "react";

import { track } from "@/lib/analytics";

const storageKey = "nahl:calculator_use";

/**
 * Set as soon as the event is reported. Covers the rest of this page load on
 * its own, and is the whole guard where session storage is unavailable.
 */
let reported = false;

function alreadyReported(): boolean {
  if (reported) return true;
  try {
    return sessionStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

function markReported(): void {
  reported = true;
  try {
    sessionStorage.setItem(storageKey, "1");
  } catch {
    // Private mode or blocked storage: the in-memory flag still holds.
  }
}

/**
 * Reports `calculator_use` the first time a visitor moves a slider.
 *
 * Returns a callback for the calculator to call on every slider interaction;
 * only the first call in a browser session reaches GA, whichever calculator
 * it comes from. The event marks "this visitor tried a calculator", so a
 * second drag, or a second calculator page, is not a second use.
 *
 *   const reportUse = useCalculatorUse("pricing");
 *   <input type="range" onChange={(e) => { reportUse(); … }} />
 *
 * Not for the prospect dashboards under /m and /m2: those pages carry no
 * analytics at all, by design.
 */
export function useCalculatorUse(calculator: string): () => void {
  return useCallback(() => {
    if (alreadyReported()) return;
    markReported();
    track({ name: "calculator_use", calculator });
  }, [calculator]);
}
