# SESSION-STATE

Handoff snapshot; update at the end of every session. **Last updated:**
13 August 2026 · HEAD `e1764cb` · 101 commits · 179 tests passing

## 1. Status

**Phases 1–5 complete. The build is done; the domain cutover is the only
thing left, and it is the founder's to execute — see `docs/CUTOVER.md`.**

Foundation, six page templates, the design pass, five service pages, all
approved copy, published pricing, the backend (three API routes, lead alerting,
chat widget), the MDX blog pipeline, the legal pages, full schema.org coverage,
GA4, the performance pass and the launch gates are all shipped.

- Live: **https://nahltech-web.vercel.app**. No custom domain yet — cutover is CC-8.
- CI green on `main` (lint · typecheck · test · build, Node 22).
- Placeholders in `en.json`: **0**. Every string is approved copy.
- Booking live: `routes.bookingUrl` → `https://cal.com/udaay-nahltech/intro-call-15-min`.
  Plain external links only; no Cal.com embed.

**Design invariants.** Gold (`#F5C842`) decorates only — never a fill or text
colour. Hexagon motif in exactly six places, bee mark in two (header, 404).
Fraunces h1/h2, Inter body. Motion inside `MotionConfig reducedMotion="user"`,
now nested in `LazyMotion … strict` — use `m.*`, never `motion.*`, or it throws.

**CC-8 (Phase 5) shipped, in five commits:**

- **Schema.org is complete** per ARCH-1 §7. `lib/schema-org.ts` now builds
  Organization, WebSite, LocalBusiness, BreadcrumbList, Service + Offer,
  OfferCatalog and SoftwareApplication alongside Article/FAQPage/Person.
  Prices are parsed from the same dictionary strings the pages render, so a
  range or "custom" yields no price rather than a guess.
- **GA4 is live** (`G-KMEM2DS98H`) with six events. Five were verified firing
  end-to-end in a browser to Google's servers (204s); `chat_lead_saved` is the
  one verified by code path only — see §5.
- **First-load JS: 153.2 → 143.5 kB gz.** The 120 kB target is not reachable
  on this stack; the itemised reason is in ARCH-1 §7 and summarised in §4(b).
- **Seven redirects** for the old site's structure.
- **Launch gates all pass against production**, and `docs/CUTOVER.md` is the
  founder-facing runbook.

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

**Vercel** — project `nahltech-web` (`prj_Yzkc8C3WgIylyvcGcXhuEAdx8aVu`), team
`nahl-technologies-projects` (`team_7JoIUGWqgJwobBinsyt2qRKH`). All eight env
vars set and exercised in production. The project has **no custom domain** yet —
only the `.vercel.app` aliases. Vercel builds on Node 24.x; `engines` is
`>=22`, so that is fine.

**GA4** — `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-KMEM2DS98H`, set in all three Vercel
environments and in `.env.local`. Absent the var, the site ships no analytics
at all and every `track()` call no-ops. **The CSP must list the Google origins
or gtag.js is blocked while the dataLayer keeps accepting pushes** — every
event looks like it fired and GA receives nothing. Covered by two tests in
`src/middleware.test.ts`; do not "tidy" those origins out.

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

**(b) The 120 kB JS target needs a founder decision.** First-load on `/` is
**143.5 kB gz**, and the remainder is not our code:

| Item | gz |
| --- | --- |
| React 19 + React DOM + Next client runtime | 100.3 kB |
| Framer Motion (`m` + `domAnimation`) | 27.7 kB |
| Google Analytics | 4.5 kB |
| **Everything we wrote** | **11.0 kB** |

The two locked dependencies alone are 128.0 kB — over target before a line of
our own code. Our code is ~7% of the page. Shaving it cannot close a 23.5 kB
gap; either the target moves to ~145 kB or the stack lock changes. Re-measure
any time with `npm run measure:js`.

**(c) Still open from the original CC-8 brief:**

- **Per-post OG images** via the file convention. This also clears the
  `Missing field "image"` flag that Rich Results reports on every post — the
  one remaining non-critical warning.
- **A Crawlmouse pass on our own site.** We sell this; it was in the launch
  gate and has not been run.
- **CLS is 0.05** against ARCH-1's `< 0.05` budget — marginally over, caused by
  the Inter web font swapping in and reflowing one section. The fix is
  `display: "optional"` on Inter, which trades a possible fallback-font render
  on slow connections. Not taken unilaterally because it is user-facing.
  Lighthouse Performance still passes at 97–98.
- **GSC and Bing sitemap submission** happen after cutover — steps are in
  `CUTOVER.md` §6, not this document.

## 5. Outstanding — founder side

- **THE CUTOVER.** `docs/CUTOVER.md`, start to finish. Read §0 before anything
  else: `nahltech.com` is already on Vercel, serving the old site from a
  project that is **not in the `Nahl Technologies' projects` team** — almost
  certainly a personal account. Vercel will not let `nahltech-web` claim a
  domain another project holds, so the domain has to be released there *first*.
  Doing it in the other order means an outage spent hunting for the old
  project. Also: `www.nahltech.com` is broken over HTTPS today, and a wildcard
  `*` A record exists.
- **GBP geo coordinates.** `LocalBusiness` ships without `geo` by decision —
  the Google Business Profile pin is the authority and a city centroid would
  sit ten miles from the street address in the same block. Send the exact
  lat/long after cutover and it takes one line.
- **`chat_lead_saved` is unverified in a browser.** It fires in
  `ChatConsentForm` on the same line as `lead_submit(chat_widget)`, which *is*
  verified, so the code path is shared and sound. Reaching it live needs a real
  chat conversation that surfaces the consent form; worth doing once by hand.
- **End-to-end alert proof.** The path works — the 13 Aug CC-8 gate lead logged
  `status='sent'`, `error=null`, 222 ms after insert — but that means Resend
  accepted it, not that it landed. Worth confirming the mail reaches the inbox.
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
- **Full-page screenshots of this site come out half-empty.** `FadeIn` uses
  `whileInView`, so anything below the fold is still at `opacity: 0` when the
  screenshot is taken. Scroll the page in steps first, then capture. Same
  reason an instant `scrollTo(bottom)` leaves sections invisible: an
  IntersectionObserver never fires for elements the viewport jumped over. This
  is inherent to `whileInView`, not a bug — a real visitor scrolling normally
  sees all of them.
- **`pkill -f "next start"` kills its own shell.** The pattern matches the bash
  process running the command, so the whole job dies with exit 144 and the
  build never runs. Use `fuser -k 3000/tcp`.
- **Python 3.10's urllib does not follow 308.** Any verification script that
  "follows" a redirect will report the 308 as the final status and look like a
  failure. Check the destination directly, or use `curl -L`.
- **Vercel's docs still show `76.76.21.21`** as the apex A record while the
  live apex sits on `216.198.79.1`. Read the target records off the project's
  Domains tab at cutover time; do not take them from docs or from memory.

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
