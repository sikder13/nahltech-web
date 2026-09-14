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
 * The short form cost length, briefly. The 3 September territory wording
 * measured 177 against the pack's 165 guideline — the new sentence being 20
 * characters longer than the one it replaced — and the pre-approved
 * ampersand fallback measured 174, so neither approved form cleared the
 * guard. It shipped at 177 on the founder's decision rather than being
 * trimmed here, and the founder supplied a 163-character rewrite later the
 * same day, which is what ships now. That one restructures the sentence rather
 * than shortening the territory list: the descriptor leads with the firm and
 * the territory in one clause, and the three capabilities follow as a
 * fragment. The territory phrase itself is unchanged and still frozen.
 *
 * All three surfaces carry it, not two. The founder's instruction named the
 * home and About meta descriptions; `site.description` is the same string by
 * construction and is what the Organization node reads, so leaving it behind
 * would have split the identity across the graph and the pages — the exact
 * failure the one-string rule exists to prevent — and failed the test that
 * pins the three identical.
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
 * The territory sentence in the "Do you come on-site?" answer was a second
 * such divergence and is closed: the founder replaced its closing clause
 * with the frozen phrase's regions on 3 September. Prose and `FAQPage`
 * markup move together because both read this one key.
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
 * ── Founder-supplied, verbatim, 3 September 2026 (DRAFTS-market-pages-
 *    batch1 + NZ addendum Part B) ────────────────────────────────────────
 *
 *   pages.marketCanada.*  ·  pages.marketGulf.*
 *   pages.marketCentralAsia.*  ·  pages.marketNewZealand.*
 *   markets.*
 *
 * Four market landing pages — Canada, the Gulf, Central Asia, New Zealand —
 * supplied as approved drafts and inserted without rewording. Four
 * amendments, every one of them decided by the founder in the same session:
 *
 * 1. `pages.marketCanada.description` came to 167 characters against the
 *    draft header's own ≤165 guard. Flagged rather than trimmed, on the
 *    precedent above; the founder picked the 163-character form that ships,
 *    which drops one "and" and changes nothing else. The other three metas
 *    passed as written (Gulf 162, Central Asia 155, New Zealand 159).
 * 2. The Central Asia lead arrived damaged — a clause end, a heading and the
 *    opening words of the next section were missing, leaving "…and prove"
 *    running straight into "our operations, quantify…". Nothing was
 *    reconstructed here. The founder supplied the whole passage verbatim:
 *    the lead now ends "…and prove the return in numbers.", the heading
 *    "What we do for Central Asian businesses" was added, and that section
 *    opens "We study your operations, quantify where…". Without it the page
 *    would not have shipped in this batch.
 * 3. One price-anchoring sentence per page is new copy approved with this
 *    relay rather than carried in the original drafts —
 *    `markets.<market>.sections[].priceAnchor`. Each was written to sit
 *    immediately after the block that quotes the figures, which is why the
 *    template renders it last within its section and not wherever it would
 *    fit.
 * 4. `markets.sentencePrefix` plus the four `anchor` values are the founder's
 *    sentence for the Indianapolis page — "We also work remotely with
 *    businesses in Canada, the Gulf region, Central Asia, and New Zealand."
 *    The home page and the /about services band render that same sentence
 *    from that same key rather than each getting a lead-in written for it.
 *    No connecting prose was authored for either placement; only the commas
 *    and the "and" are code, and `markets.test.ts` pins the assembled
 *    sentence character for character.
 *
 * The prices in this copy are prose, so `pricing-mirror` cannot govern them
 * the way it governs the Indianapolis table. `markets.test.ts` takes the
 * other route to the same guarantee: it reads every dollar figure out of all
 * four pages and fails if one is not a figure the rate card publishes.
 *
 * ── Founder-supplied, verbatim, 3 September 2026 (phrase harmonisation) ──
 *
 * The Canada page's first FAQ answer named three regions where the
 * descriptor names four — it was written before New Zealand joined and
 * shipped unamended because the instruction was verbatim insertion. The
 * founder supplied the corrected clause, and the matching one for the
 * Indianapolis page, in the same decision: **the frozen phrase wins
 * everywhere**. The site now states its territory one way, in prose and in
 * `FAQPage` markup alike, since both read these keys.
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
 * ── Founder-supplied, verbatim, 13 September 2026 (DRAFT-manufacturing-
 *    hub) ──────────────────────────────────────────────────────────────────
 *
 *   pages.manufacturing.*
 *   manufacturing.*
 *
 * The manufacturers landing page, supplied as an approved draft and inserted
 * without rewording. No amendments: every price the copy quotes is one the
 * rate card publishes ($2,500 credited within 90 days, AI Automation builds
 * from $7,500, live in 75 days), and no banned word appears.
 *
 * The draft header labels the meta description "156 chars"; the sentence it
 * labels measures 159. The label is the miscount, not the sentence — it
 * ships as approved, inside the 165 guard the other landing pages hold.
 *
 * The draft is stored split, not rewritten. Two paragraphs and four bullets
 * each carry one link, so each is held as `before` / `anchor` / `after`, and
 * the parts rejoin — `before`, one space, `anchor`, `after` exactly — to the
 * approved sentence; `manufacturing.test.ts` asserts the joined text against
 * the draft. The anchors are the ones the relay specified: the four pieces'
 * titles as the draft writes them, "our Canadian AI funding guide", and "our
 * pricing page", which is the draft's own phrase and the one not already
 * spent on /pricing — "pricing page" is.
 *
 *   manufacturing.inboundLinks.home
 *   manufacturing.inboundLinks.servicesHub
 *   manufacturing.inboundLinks.aiConsultingIndianapolis
 *
 * Also founder-supplied verbatim, in the same relay: the home page's anchor,
 * the one-line /services entry, and the closing sentence of the Indianapolis
 * page's "Who this is for". Unlike the Indianapolis inbound lead-ins recorded
 * below, no connecting prose was authored for any of the three — the home
 * placement is a card whose title is the anchor and whose description is the
 * page's own meta description, the same arrangement the Indianapolis card has.
 *
 * The CTA renders through the shared `CtaBlock`, so the draft's "· Or call
 * (317) 507-4303. A real person answers." reads "or call (317) 507-4303 — a
 * real person answers", exactly as the Indianapolis page's does. Same words;
 * the joining punctuation is the block's.
 *
 * ── Founder-supplied, verbatim, 13 September 2026 (Canada concentration
 *    passage) ───────────────────────────────────────────────────────────────
 *
 *   markets.canada.sections[1]   heading · linkedParagraph
 *
 * One new section on /markets/canada, "Where our Canadian work
 * concentrates", placed after the execution-gap section and before the
 * practical questions, as instructed. Nothing else on the page changed.
 *
 * The paragraph carries its link mid-sentence, so it is stored split as
 * `before` / `anchor` / `after` and rejoins — `before`, one space, `anchor`,
 * `after` exactly — to the approved text. The anchor, "study of how AI
 * funding actually works in Canada right now", was checked unspent against a
 * crawl of production before it shipped, and is recorded in
 * docs/anchor-ledger.md.
 *
 * `$200,000` is the first dollar figure on a market page that is not a
 * price: it is what the passage says a specialist hire costs. The gate in
 * `markets.test.ts` that fails any figure /pricing does not publish names it
 * as an exception for this page only, and a second test fails if the
 * exception outlives the sentence.
 *
 * ── Founder-supplied, verbatim, 14 September 2026 (MRG guide inbound
 *    sentence) ──────────────────────────────────────────────────────────────
 *
 *   manufacturing.grants.paragraph
 *
 * One sentence added to /manufacturing's "Grant money, plainly": "The full
 * guide: what Indiana's Manufacturing Readiness Grants actually fund." It is
 * the last sentence of the Indiana passage, right after "Quoting time is a
 * lead time." and before the Canada passage. The link is "what Indiana's
 * Manufacturing Readiness Grants actually fund"; "The full guide:" stays
 * plain text. The relay did not mark the link span, so that choice is ours
 * and recorded here.
 *
 * The paragraph now carries two links, so it is stored as two runs rather
 * than one before / anchor / after. Each run rejoins as before; the runs join
 * with one space. The rest of the paragraph is character for character what
 * shipped on 13 September.
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
