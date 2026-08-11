import { isLiveLocale, liveLocales, type LiveLocale } from "./config";

import type enDictionary from "./dictionaries/en.json";

/**
 * The English dictionary defines the contract. Every other locale must
 * satisfy the same shape, so a missing key is a type error rather than a
 * blank space on a live page.
 */
export type Dictionary = typeof enDictionary;

/**
 * COPY PROVENANCE
 *
 * Hard rule 12 makes copy authorship a tracked thing: product facts,
 * statistics, client claims and pricing come from the founder, never from a
 * build session. This block is the audit trail for strings that did not.
 *
 * It lives here because `en.json` is JSON and cannot carry a comment. Anyone
 * auditing the copy should read this file alongside the dictionary.
 *
 * Everything not listed below is founder-supplied and predates this block.
 *
 * ── CC-5-authored, approved 11 August 2026 ────────────────────────────────
 *
 * Interface microcopy only. None of it states a product fact, a number, a
 * client claim or a price; each string names a state the interface can be in.
 *
 *   leadForm.sending        submit button label while a POST is in flight
 *   leadForm.rateLimited    shown on a 429 from /api/lead or /api/subscribe
 *   leadForm.networkError   shown when the request never reached us
 *
 *   chat.launcherLabel      accessible name of the closed launcher
 *   chat.closeLabel         accessible name of the panel's close control
 *   chat.title              panel heading, also its accessible name
 *   chat.placeholder        message input placeholder and its sr-only label
 *   chat.send               send button label
 *   chat.conversationLabel  accessible name of the aria-live message region
 *   chat.youLabel           speaker prefix on the visitor's turns
 *   chat.assistantLabel     speaker prefix on the assistant's turns
 *   chat.fallback           shown when the Anthropic call fails
 *   chat.consentPrompt      question above the save-my-details form
 *   chat.consentButton      submit label on that form
 *   chat.consentSuccess     in-thread confirmation after a lead is saved
 *
 * Two of those twelve are the founder's own wording, quoted from the Phase 4
 * brief rather than written here: `chat.fallback` and `chat.consentButton`.
 * They are listed above because they are new keys, not because their text was
 * authored in this session.
 *
 * ── Founder-supplied, verbatim, 11 August 2026 ────────────────────────────
 *
 *   newsletter.heading · newsletter.sublabel · newsletter.placeholder
 *   newsletter.button  · newsletter.success
 *
 * ── Not yet written ───────────────────────────────────────────────────────
 *
 * Two `[PLACEHOLDER: …]` strings remain, both on legal pages. They stay
 * placeholders until the founder provides the text.
 */

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
