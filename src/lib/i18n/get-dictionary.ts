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
 * ── CC-CHAT-2-authored, approved 16 August 2026 ───────────────────────────
 *
 * Interface microcopy on the same terms: a state the panel can be in, no
 * product fact, number, claim or price between them.
 *
 *   chat.captureChip         the quiet standing offer above the input, shown
 *                            once a conversation has run on without the
 *                            assistant asking for the form
 *   chat.captureChipDismiss  accessible name of that chip's dismiss control
 *
 * `chat.captureChip` is the founder's own wording, quoted from the CC-CHAT-2
 * brief.
 *
 * ── Founder-supplied, verbatim, 11 August 2026 ────────────────────────────
 *
 *   newsletter.heading · newsletter.sublabel · newsletter.placeholder
 *   newsletter.button  · newsletter.success
 *
 *   legalPage.privacy.* · legalPage.terms.* · legalPage.dpa.*
 *   legalPage.lastUpdated
 *
 * The legal copy is a pragmatic startup baseline drafted in-house and is
 * NOT attorney-reviewed. Counsel review is tracked as a founder-side task in
 * docs/SESSION-STATE.md §5; the intent is to ship now and revise on review.
 *
 * `pages.terms.title`, `pages.dpa.title`, `legal.terms` and `legal.dpa` were
 * renamed to match the titles on that approved copy — "Terms of Use" and
 * "Data Processing", replacing "Terms of Service" and "Data Processing
 * Addendum".
 *
 * ── Founder-supplied, verbatim, 22 August 2026 ────────────────────────────
 *
 *   about.services.heading · about.services.intro
 *   about.services.items.<service>.label
 *   about.services.items.<service>.description
 *
 * The five link sentences on /about, supplied by the internal-linking
 * relay as approved copy and inserted without rewording. Each one names
 * what a service is; none of them states a price or a client claim.
 *
 * ── Founder-supplied, verbatim, 22 August 2026 (COPY-PACK-1) ──────────────
 *
 *   about.intro              §1, the canonical descriptor. Rendered as the
 *                            About page lead, above everything else.
 *   site.description         §2, the short form. Read by the Organization
 *                            node in schema-org.ts.
 *   pages.home.description   §2, character-identical to site.description
 *   pages.about.description  §2, character-identical to site.description
 *
 * One string on three surfaces by design: the meta descriptions and the
 * Organization node have to agree, and the way to guarantee that is for them
 * to be the same string. `copy-provenance.test.ts` pins the three as identical,
 * so editing one and not the others fails rather than drifts.
 *
 * Two notes for whoever audits this against the pack:
 *
 * §2 is 171 characters, not the 158 the pack states. It was inserted at its
 * supplied length regardless — hard rule 12 makes the copy the founder's, and
 * trimming to fit a guideline would be rewriting it. Google truncates the
 * display around 155-160, so the tail after "for businesses across the" is
 * unlikely to render in a result. Flagged, not fixed.
 *
 * `pages.about.description` carries no "About Nahl Technologies: " prefix.
 * The pack made that prefix conditional on the result staying under 165
 * characters; it comes to 196, so the pack's own rule selects §2 unmodified.
 *
 * ── Not yet written ───────────────────────────────────────────────────────
 *
 * 0 `[PLACEHOLDER: …]` strings remain. Every string in en.json is approved
 * copy. Blog post titles and meta descriptions live in the frontmatter of
 * content/blog/*.mdx rather than here; their provenance is recorded in
 * docs/blog-migration-diff.md.
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
