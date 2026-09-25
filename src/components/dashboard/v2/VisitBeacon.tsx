"use client";

import { useEffect } from "react";

/**
 * Counts that the page was opened. Nothing more.
 *
 * The letter this page answers promises that no one will call because the
 * reader visited, and that promise is treated as binding. So the beacon
 * carries the page token and nothing else: no cookie, no storage, no
 * referrer, no user agent, no identifier of any kind. The server stores the
 * token and a timestamp. It is a tally that the letter arrived, not a record
 * of who read it.
 *
 * It stands down entirely when the browser sends Global Privacy Control or
 * Do Not Track, and on `?preview`, so our own checks do not inflate a count
 * of one.
 */
export function VisitBeacon({ token }: { token: string }) {
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.globalPrivacyControl || nav.doNotTrack === "1") return;
    // Automated browsers (test runs, audits, rendering crawlers) are not readers.
    if (nav.webdriver) return;
    if (new URLSearchParams(window.location.search).has("preview")) return;
    if (typeof nav.sendBeacon !== "function") return;
    nav.sendBeacon(
      "/api/visit2",
      new Blob([JSON.stringify({ token })], { type: "application/json" }),
    );
  }, [token]);

  return null;
}
