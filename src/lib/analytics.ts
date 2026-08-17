"use client";

import { sendGAEvent } from "@next/third-parties/google";

/**
 * GA4 event reporting.
 *
 * The six events the site reports are enumerated here as a closed union rather
 * than passed as loose strings. An analytics property is only as good as the
 * consistency of its event names, and a typo in a string literal produces a
 * silently separate event that nobody notices until a report is wrong.
 *
 * Every call no-ops when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset — which is
 * the normal state in development and in any preview without the var. That
 * keeps the console clean and means nothing here has to be conditionally
 * imported at the call sites.
 */
const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export type AnalyticsEvent =
  /** A lead reached /api/lead successfully. `source` names the entry point. */
  | {
      name: "lead_submit";
      source: "contact_form" | "chat_widget" | "service_page";
    }
  /** Newsletter subscription accepted. */
  | { name: "subscribe" }
  /** The chat panel was opened. Not fired on close. */
  | { name: "chat_opened" }
  /** A chat conversation produced a lead. */
  | { name: "chat_lead_saved" }
  /** A visitor followed a booking link off-site. */
  | { name: "booking_click" }
  /** A visitor followed a link to Crawlmouse. */
  | { name: "crawlmouse_click" };

export function track(event: AnalyticsEvent): void {
  if (!measurementId) return;

  const { name, ...params } = event;
  sendGAEvent("event", name, params);
}
