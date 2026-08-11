/**
 * Where a submission came from, read in the browser at submit time.
 *
 * The route caps and re-validates every one of these (see `leadServerSchema`)
 * — they arrive from the client, so they are input, not evidence. Collected
 * here rather than in each form so the contact form and the chat widget's
 * consent form report the same shape.
 */

export type Attribution = {
  landing_page: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  locale: string;
};

const EMPTY: Attribution = {
  landing_page: "",
  referrer: "",
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  locale: "en",
};

export function collectAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY;

  const params = new URLSearchParams(window.location.search);
  const get = (key: string) => params.get(key)?.slice(0, 200) ?? "";

  return {
    landing_page: `${window.location.pathname}${window.location.search}`.slice(
      0,
      500,
    ),
    referrer: document.referrer.slice(0, 500),
    utm_source: get("utm_source"),
    utm_medium: get("utm_medium"),
    utm_campaign: get("utm_campaign"),
    locale: document.documentElement.lang || "en",
  };
}
