"use client";

import { useEffect } from "react";

import { track } from "@/lib/analytics";
import { bookingUrl, productLinks } from "@/lib/routes";

/**
 * Reports clicks on the two off-site destinations we care about.
 *
 * One delegated listener rather than an `onClick` at each call site. Booking
 * links appear in eight places and the Crawlmouse link in three, all rendered
 * by server components — attaching handlers would mean converting `ButtonLink`
 * and every template that uses it into client components, shipping their JS to
 * every page to measure a click. That is a direct trade against the first-load
 * budget in ARCH-1 §7, and it loses.
 *
 * Delegation also cannot miss a link: a CTA added later is measured without
 * anyone remembering to instrument it.
 *
 * Matching is by host, so it survives a path or query change on either target
 * (Cal.com appends its own parameters).
 */
function hostOf(url: string): string | null {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const bookingHost = bookingUrl ? hostOf(bookingUrl) : null;
const crawlmouseHost = hostOf(productLinks.crawlmouse);

export function OutboundEvents() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      // `.href` on an anchor element is already resolved to an absolute URL.
      if (!anchor) return;

      const host = hostOf(anchor.href);
      if (!host) return;

      if (bookingHost && host === bookingHost) {
        track({ name: "booking_click" });
      } else if (crawlmouseHost && host === crawlmouseHost) {
        track({ name: "crawlmouse_click" });
      }
    }

    // Capture phase: the event is recorded even if something downstream stops
    // propagation before it reaches the document.
    document.addEventListener("click", onClick, { capture: true });
    return () =>
      document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
