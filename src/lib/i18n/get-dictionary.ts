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
 * §2 was amended on 22 August. The first version measured 171 characters
 * against the 158 the pack claimed, which was flagged rather than trimmed —
 * hard rule 12 makes the copy the founder's, and cutting approved copy to fit
 * a guideline is rewriting it. The founder supplied a 158-character
 * replacement instead. The sentence that changed is the third: "for
 * businesses across the US, Canada, and the Gulf region" became "Serving the
 * US, Canada, and the Gulf region". That form shipped until 3 September; the
 * territory block below supersedes its third sentence and nothing else.
 *
 * `pages.about.description` carries no "About Nahl Technologies: " prefix.
 * The pack made that prefix conditional on the result staying at or under 165
 * characters; prefixed it comes to 202, so the pack's own rule still selects
 * §2 unmodified.
 *
 * ── Founder-supplied, verbatim, 3 September 2026 (territory expansion) ─────
 *
 *   about.intro              §1, third clause only
 *   site.description         §2, third sentence only
 *   pages.home.description   §2, character-identical to site.description
 *   pages.about.description  §2, character-identical to site.description
 *
 * GTM expanded to the USA, Canada, the UAE, Saudi Arabia, Kazakhstan and New
 * Zealand, so the one sentence that names the territory changed and nothing
 * else did:
 *
 *   long form   "serving businesses across the United States, Canada, and the
 *               Gulf region" → "serving businesses across North America, the
 *               Gulf region, Central Asia, and New Zealand"
 *   short form  "Serving the US, Canada, and the Gulf region." → "Serving
 *               North America, the Gulf, Central Asia, and New Zealand."
 *
 * **This phrase is now frozen.** It is not a string to keep tuning: repeated
 * identity churn resets the convergence of what AI systems answer about this
 * company, which is the whole reason the sentence exists in one place. The
 * expansion was authorised as a single change. Do not reword it again without
 * an explicit founder decision that accepts that cost.
 *
 * The short form costs length. §2 measured 158 characters and now measures
 * 177, over the pack's own 165 guideline, because the new sentence is 20
 * characters longer than the one it replaces. The relay anticipated an
 * overflow and pre-approved "Serving North America, the Gulf, Central Asia &
 * New Zealand." as the fallback; that form measures 174 and is also over, so
 * it buys nothing the approved wording does not already have. Shipped at the
 * approved wording under hard rule 12 — a shorter sentence would be new copy,
 * and writing it is the founder's to do, not this file's. Google truncates
 * display around 155-160, so the tail is at risk in a SERP snippet; the
 * Organization node carries the full string either way, and that is the
 * surface this sentence was rewritten for.
 *
 * ── CC-authored microcopy, 22 August 2026 ─────────────────────────────────
 *
 *   footer.social.github  accessible name of the GitHub link in the footer
 *
 * Interface microcopy on the same terms as the block above: it names a
 * destination, states no product fact, number, claim or price, and follows
 * the wording of the three sibling labels it sits beside.
 *
 * ── Founder-supplied, verbatim, 24 August 2026 (DRAFT-ai-consulting-
 *    indianapolis) ─────────────────────────────────────────────────────────
 *
 *   pages.aiConsultingIndianapolis.*
 *   aiConsultingIndianapolis.*  — except `inboundLinks`, recorded below
 *
 * The Indianapolis landing page, supplied as an approved draft and inserted
 * without rewording. Four amendments, each authorised by the founder in the
 * same session rather than decided here:
 *
 * 1. The draft's audit figure ($1,500–$3,500) contradicted the published
 *    rate card ($2,500). The founder supplied a replacement sentence for the
 *    lead — "A full audit is $2,500, fully credited toward your first
 *    project." — which is what ships.
 * 2. Same conflict in the first FAQ answer, same resolution: the founder
 *    supplied the replacement pricing sentence verbatim, naming $2,500,
 *    the 90-day credit window, and $6,000 as the build entry point.
 * 3. `audience.closing` drops one word. The draft read "enterprise
 *    transformation program", and "transform" is on the hard-rule-15 banned
 *    list without the quotation marks the rejection exception requires. It
 *    was flagged rather than reworded, and the founder chose removal of the
 *    single word over the alternatives.
 * 4. `pages.aiConsultingIndianapolis.description` measures 163 characters
 *    against the draft header's own ≤165 guard; the draft's own wording came
 *    to 171. Flagged rather than trimmed on this file's own precedent (see
 *    COPY-PACK-1 §2 above), and the founder selected the two-word trim that
 *    ships — "scoped builds that go live" became "scoped builds live".
 *
 * The prices the table shows are not in the dictionary at all. They are read
 * out of `pricing.*` at render time by `lib/pricing-mirror.ts`, so the page
 * cannot quote a figure /pricing does not publish. Hard rule 12 by
 * construction rather than by review.
 *
 * One duration on that page is knowingly out of step and is the founder's to
 * settle: the audit row says "Two weeks" where the rate card says "two to
 * three weeks". It is not a price, so the mirror does not govern it, and the
 * founder's instruction was no rewording beyond the two supplied sentences.
 *
 * ── Founder-supplied, verbatim, 24 August 2026 ────────────────────────────
 *
 *   pricing.guarantee
 *
 * The 75-day delivery promise, approved with the draft above and added to
 * the rate card in the same session so the two pages agree. It lives under
 * `pricing` rather than with the landing-page copy because it is a term of
 * the rate card: /pricing renders it under the builds, and the Indianapolis
 * page renders the same key under its mirrored table. One string, two
 * surfaces, for the same reason the descriptor is one string across three.
 *
 * It sits with the builds, not the tiers, because it does not cover audits —
 * which the page's third FAQ states out loud.
 *
 * ── CC-authored microcopy, 24 August 2026 ─────────────────────────────────
 *
 *   aiConsultingIndianapolis.inboundLinks.servicesHub
 *   aiConsultingIndianapolis.inboundLinks.aiConsultancy
 *
 * The two lead-ins that carry the internal link to the Indianapolis page
 * from /services and /services/ai-consultancy. Navigational microcopy on the
 * same terms as the blocks above: each names a destination and asks a
 * qualifying question, and neither states a product fact, number, claim or
 * price. The link text itself is not authored here — both render
 * `aiConsultingIndianapolis.anchor`, which is the founder's specified anchor.
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
