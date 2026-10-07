"use client";

import { useEffect } from "react";

import { track } from "@/lib/analytics";
import { bookingUrl, productLinks } from "@/lib/routes";

/**
 * Reports clicks on the off-site destinations we care about.
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
 *
 * A Cal.com link reports twice: `cal_click` for any Cal.com host, which is
 * the one marked as a key event, and `booking_click` for the booking link
 * specifically, kept so the reports built on it do not lose their history.
 */
function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function hostOf(url: URL | null): string | null {
  return url ? url.host.replace(/^www\./, "") : null;
}

/**
 * Cal.com itself or a subdomain of it. A suffix match on the dot rather than
 * a substring test, which would also claim any domain ending in "cal.com".
 */
function isCalHost(host: string): boolean {
  return host === "cal.com" || host.endsWith(".cal.com");
}

const bookingHost = bookingUrl ? hostOf(parse(bookingUrl)) : null;
const crawlmouseHost = hostOf(parse(productLinks.crawlmouse));

export function OutboundEvents() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      // `.href` on an anchor element is already resolved to an absolute URL.
      if (!anchor) return;

      const url = parse(anchor.href);
      const host = hostOf(url);
      if (!url || !host) return;

      if (isCalHost(host)) {
        track({
          name: "cal_click",
          link_domain: host,
          link_url: `${url.origin}${url.pathname}`,
        });
      }

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
