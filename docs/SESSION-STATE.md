# SESSION-STATE

Handoff snapshot; update at the end of every session. **Last updated:**
13 August 2026 · HEAD `cdd3258` · 95 commits · 150 tests passing

## 1. Status

Phases 1–4 complete, blog production underway. Foundation, six page templates,
the design pass, five service pages, all approved copy, published pricing, the
backend (three API routes, lead alerting, chat widget), the MDX blog pipeline
and the legal pages are shipped.

- Live: **https://nahltech-web.vercel.app**. No custom domain yet — cutover is CC-8.
- CI green on `main` (lint · typecheck · test · build, Node 22).
- Placeholders in `en.json`: **0**. Every string is approved copy.
- Booking live: `routes.bookingUrl` → `https://cal.com/udaay-nahltech/intro-call-15-min`.
  Plain external links only; no Cal.com embed.

**Design invariants.** Gold (`#F5C842`) decorates only — never a fill or text
colour. Hexagon motif in exactly six places, bee mark in two (header, 404).
Fraunces h1/h2, Inter body. Motion inside `MotionConfig reducedMotion="user"`.

## 2. Blog state

Pipeline: `content/blog/*.mdx` → `src/lib/blog.ts` (zod frontmatter plus
build-time gates) → `next-mdx-remote/rsc`. Rules and their reasoning live in
`docs/blog-content-conventions.md`.

**Legacy posts (5, migrated and revised).** Three in `field-notes`, two in
`brand`; `archive` exists in the schema but holds no posts. Citations in the
data-gap post were corrected against the verified reference set; the honeybee
post carries an italic editor's note dating it to March 2026, original prose
intact below. Every edit is logged in `docs/blog-migration-diff.md`.

**Cluster `decision`** — the founder's P-labels in brackets:

| Slug | Author | Status |
| --- | --- | --- |
| `seo-cost-indianapolis` [P1] | Udaay Sikder | Shipped |
| `website-cost-indiana-small-business` [P2] | Samia Zaman | Shipped |
| `ai-chatbot-vs-receptionist` [P3] | Udaay Sikder | Shipped |
| `ai-opportunity-audit-worked-example` [P4] | Samia Zaman | Shipped |
| `indianapolis-business-chatgpt-visibility` [P5] | Samia Zaman | Shipped |

P5 was written by a session that crashed before verifying or committing it.
The following session ran the full gate set against it: build, lint,
typecheck, 150 tests, banned words, em-dash density, link resolution,
Article + FAQPage schema and a 390px render. All pass. It shipped at
`7440f59` and is live and verified (200, Article + FAQPage, correct byline).

**P5 has no founder P-label on record.** P1–P4 were each assigned one before
being written; the crashed session left no note of an assignment for this
topic. The founder cleared it to publish on 12 Aug 2026 without one, so the
post is live — but the assignment gap is recorded here rather than lost.

**Sibling backfill debt.** Each post carries its own two sibling links, so
every post clears the gate independently, but the cluster is not densely
linked: nothing links to P4 or P5 yet. Backfilling is deferred work, not a
gate failure.

**Citation check on P5.** Four statistics were verified against sources this
session. BrightLocal 6% → 45%, SOCi 1.2%, and the Vercel crawler finding all
hold. One did not: the claim that SOCi found ChatGPT's picks skewed toward
big chains and heavily reviewed brands is unsupported by the source, and the
SOCi study is itself of 2,751 multi-location brands. It was replaced with the
study's real scope plus its restaurant finding. The home-services numbers now
match the cited source exactly (80% earn some citation, 15% take the top
recommendation). Treat any statistic written by a session as unverified until
checked against the source.

- **Sibling-link gate.** A `field-notes` or `decision` post needs one offer link
  (`/services/*`, `/products/*`, `/pricing`) plus two sibling links. The sibling
  half applies only once a cluster holds three or more published posts; below
  that it is waived and the build prints a `NOTICE` naming each waived post so
  the links get backfilled later. `brand` and `archive` are exempt from both;
  dead-link checking applies everywhere. `decision` crossed three posts this
  session, so the gate is live there and the build emits **zero NOTICEs**.
- **Crawlmouse links.** One to two per post, varied anchor text, never the same
  anchor twice, none where there is no honest angle — absence is the correct
  outcome, not a gap. P2 has an approved three-link exception specific to that
  post; the documented cap is unchanged.
- **Authors.** `src/lib/authors.ts` is the registry and the loader rejects any
  byline not in it. Udaay Sikder (P1, P3, legacy): "Founder & CEO", `/about` URL.
  Samia Zaman (P2, P4 onward): "Social Media & Growth Manager", `worksFor` Nahl
  Technologies Inc., `sameAs` her LinkedIn — no `/about` URL, deliberately.
- **Structured data.** Article on every post; FAQPage parsed from the post's own
  FAQ section so the markup cannot drift from the visible text. Rich Results Test
  reports Article only — it has not evaluated FAQPage for sites like ours since
  the 2023 restriction, which is expected, not a failure. The one non-critical
  flag left everywhere is `Missing field "image"`, cleared by CC-8's OG work.

## 3. Infra facts

**Supabase** — project `nahltech-web`, ref `posdwhozfmlofsvqfohn`,
org `yhkazuzdlcaqgealmjjp`, us-east-1 (N. Virginia), Postgres 17.6.

- Migrations `0001` and `0002` committed and applied. RLS on all 7 tables. No
  test data left: every probe row from this session was deleted.
- `anon` SELECT is false on every table; `anon` INSERT is true on
  `chat_conversations` and `chat_messages` only. Since anon cannot SELECT,
  `INSERT … RETURNING` is unavailable to the browser — the chat client makes
  its own UUIDs.

**Vercel** — project `nahltech-web`, team `nahl-technologies-projects`. All
seven env vars set and exercised in production.

- **Resend sending domain is verified.** Confirmed 12 Aug 2026 by a probe lead
  through the deployed `/api/lead`: `notification_log` recorded `status='sent'`,
  no error. It was unverified and logging `failed` earlier in this session, so
  any note older than 12 Aug describing failed alerts is stale.
- The `RESEND_API_KEY` in `.env.local` is send-restricted: it sends mail but
  returns 401 on the domains endpoint, so domain status cannot be queried with
  it. Check by sending and reading `notification_log`.
- SSO protection on all deployments except custom domains, so per-deployment
  URLs 302; the `nahltech-web.vercel.app` alias is public.

## 4. Next

**(a) Blog relay is clear.** P1–P5 are all live; nothing is pending. The only
blog debt left is the sibling backfill into P4 and P5, which is deferred work
rather than a gate failure.

Usual treatment for a new post: verify it parses, FAQ schema,
offer/sibling/dead-link checks, banned-word grep, 390px table check,
screenshots — plus check every statistic against its source.

**(b) CC-8 — SEO and launch.**

- schema.org completion: BreadcrumbList, Organization, WebSite, LocalBusiness
  (NAP matching GBP exactly), Service + Offer, OfferCatalog. `lib/schema-org.ts`
  has Article, FAQPage and Person only.
- GA4 and Google Search Console wiring, plus Bing Webmaster.
- Performance pass. First-load JS on `/` is **151.5 kB gzipped** against the
  120 kB target — roughly **31 kB to find**. The measurement method is in
  ARCH-1 §7 so the next number is comparable.
- Lighthouse gate (SEO/A11y/Best-Practices 100, Perf ≥95 mobile) + a Crawlmouse
  pass on our own site.
- Per-post OG images via the file convention; also clears the Rich Results flag.
- **DNS cutover.** Registrar/DNS is the Northwest panel. `@` and `www` are
  currently split between old Vercel records and Northwest hosting IPs —
  **both must move**. Plan it as one change, not two.

## 5. Outstanding — founder side

- **End-to-end alert proof.** The path works — the 12 Aug probe lead logged
  `status='sent'` — but that means Resend accepted it, not that it landed.
  Worth confirming the mail reaches the inbox.
- **Counsel review of the legal pages.** An in-house startup baseline, shipped
  on the explicit understanding that it is revised on review.
- **Keyword Planner hour.** The `field-notes` and `decision` target keywords
  were assigned without Planner data and are marked unvalidated.
- Team photos for `/about` (neutral glyphs today; no stock photography), a logo
  asset (header uses a typeset wordmark + bee mark), and Samia Zaman added to
  the page — until then her author entry deliberately has no `/about` URL.
- Hafsa Sastho Play Store URL — expected 1 Sept 2026. `productLinks.hafsaSastho`
  is `null`, so the "Try it live" button is omitted rather than broken.

## 6. Known quirks

- **Four sentences over 30 words**, all CC-3 approved copy, deliberately not
  edited: `servicePages.aiSearchVisibility.problem` (41w),
  `productPages.crawlmouse.tagline` (36w), `about.storyParagraphs[1]` (35w),
  `productPages.hafsaSastho.tagline` (31w).
- **`next/font` can fail fetching Fraunces from Google** when `.next` is
  deleted, since that discards the font cache. Surfaces as `NextFontError`
  during build. A retry fixes it; avoid wiping `.next` routinely.
- **Vercel Attack Challenge Mode** trips on polling loops against production
  and returns 403 "Vercel Security Checkpoint" on every route. Verify against
  a local production build (`next build && next start`) and hit the live URL
  once. Clear it in Project → Firewall if it fires.
- **Spacing tokens shadow Tailwind's width scale.** Never use a named size
  utility ending in sm/md/lg/xl/2xl/3xl — use `max-w-prose` or a
  `max-w-(--container-*)` token. `src/styles/tokens.test.ts` enforces this.
- `localhost` resolves unreliably in some sandboxes; `127.0.0.1` works.
- **`next start -H 127.0.0.1` breaks the locale rewrite.** Next then treats
  the middleware's rewrite target as a different origin, converts it to a
  redirect, and every page 308s to itself. Start it with no `-H` flag.
- **Node 22 is required, not preferred.** jsdom 30's undici needs a Node 22
  internal; on Node 20 every vitest worker dies at startup and the suite
  reports "no tests" rather than a version error. `.npmrc` sets
  `engine-strict=true` so this now fails at install. **A fresh shell here
  starts on Node 20**, so run `nvm use` (picks up `.nvmrc` → 22.23.1) before
  the suite. Hitting this looks exactly like a broken test suite: the run
  exits 0 and reports "no tests" with 24 errors. It is not a real failure.
- **Middleware runs on `/api/*`.** It returns early for them, but anything
  added to the locale logic must keep that early return — without it the
  rewrite sends API calls to `/en/api/*`, which does not exist, and all three
  routes answer 500.
- **`.mdx` is not covered by lint-staged**, whose globs are `*.{ts,tsx}` and
  `*.{js,mjs,json,css,md}`. Post files keep whatever emphasis markers were
  typed, so match on exact text when editing them programmatically.
- **Pasted-attachment replies to the strategist arrive empty.** The founder
  exports `.odt` instead.

## 7. Process rules

`CLAUDE.md` at repo root is authoritative — rules 1–15. The ones that bite
most often:

- **11** no AI attribution anywhere: commits, PR titles/bodies, comments,
  file headers.
- **12** placeholder gates — never invent product facts, statistics, client
  claims or pricing. Unapproved copy stays `[PLACEHOLDER: …]`.
- **13** visual verification — end every UI session with the site viewable
  plus the list of URLs and what changed.
- **14** never squash, never amend a pushed commit, push after each session.
- **15** banned words in site copy; flag rather than ship.

Architecture reference: `docs/ARCH-1-system-architecture.md`.
