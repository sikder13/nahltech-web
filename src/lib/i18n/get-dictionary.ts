import { isLiveLocale, liveLocales, type LiveLocale } from "./config";

import type enDictionary from "./dictionaries/en.json";

/**
 * The English dictionary defines the contract. Every other locale must
 * satisfy the same shape, so a missing key is a type error rather than a
 * blank space on a live page.
 */
export type Dictionary = typeof enDictionary;

const loaders: Record<LiveLocale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

/**
 * Loads the dictionary for a locale.
 *
 * Throws for anything that is not a live locale — including `ar` and `bn`,
 * which are configured but have no content yet. Callers in the routing layer
 * should check `isLiveLocale` and call `notFound()` before reaching here; a
 * throw means a bug, not a bad URL.
 */
export async function getDictionary(locale: string): Promise<Dictionary> {
  if (!isLiveLocale(locale)) {
    throw new Error(
      `No dictionary for locale "${locale}". Live locales: ${liveLocales.join(", ")}.`,
    );
  }

  return loaders[locale]();
}
