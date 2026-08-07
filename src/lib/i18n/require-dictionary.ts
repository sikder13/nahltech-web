import { notFound } from "next/navigation";

import { isLiveLocale } from "./config";
import { getDictionary, type Dictionary } from "./get-dictionary";

/**
 * Routing-layer entry point for loading a dictionary.
 *
 * Every layout, page and metadata function goes through this rather than
 * calling `getDictionary` directly. The distinction matters: a non-live
 * locale is a bad URL, not a bug, so it must produce a 404 rather than an
 * exception.
 *
 * Layouts and pages render concurrently, so the guard cannot live only in the
 * layout — whichever segment resolves first decides the response, and a page
 * that threw would surface as a 500 before the layout's 404 ever landed.
 */
export async function requireDictionary(locale: string): Promise<Dictionary> {
  if (!isLiveLocale(locale)) {
    notFound();
  }

  return getDictionary(locale);
}
