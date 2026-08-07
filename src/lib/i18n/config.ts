/**
 * Locale configuration.
 *
 * `locales` is every locale the routing layer knows about. `liveLocales` is
 * the subset that has approved, human-written content. Only live locales are
 * routable, statically generated, listed in the sitemap, or emitted as
 * hreflang — pointing any of those at an empty locale is an SEO error.
 *
 * Launching a new locale is a content task: translate the dictionary, then
 * add the locale here.
 */
export const locales = ["en", "ar", "bn"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale = "en" as const satisfies Locale;

export const rtlLocales = ["ar"] as const satisfies readonly Locale[];

export const liveLocales = ["en"] as const satisfies readonly Locale[];

export type LiveLocale = (typeof liveLocales)[number];

export type Direction = "ltr" | "rtl";

/** Whether the routing layer recognises this string as a locale at all. */
export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Whether this locale has content and may be served. */
export function isLiveLocale(value: string): value is LiveLocale {
  return (liveLocales as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): Direction {
  return (rtlLocales as readonly string[]).includes(locale) ? "rtl" : "ltr";
}
