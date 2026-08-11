# SESSION-STATE

Handoff snapshot. Update at the end of every session.

**Last updated:** 11 August 2026 · HEAD `cd05602` · 73 commits · 102 tests passing

## 1. Status

Phases 1–4 complete: foundation, six page templates, design distinctiveness
pass, five-service restructure, all approved copy, pricing page with real
published numbers, and the backend — three API routes, lead alerting and the
chat widget.

- Live: **https://nahltech-web.vercel.app**
- No custom domain attached. Deliberate — cutover is Phase 5.
- CI green on `main` (lint · typecheck · test · build, Node 22).
- Vercel builds on Node 24.x; CI and `.nvmrc` pin 22. Legal under
  `engines: >=22`, but the runtimes differ.
- Placeholders remaining in `en.json`: **2**, both legal.
- Booking is live: `routes.bookingUrl` →
  `https://cal.com/udaay-nahltech/intro-call-15-min`. Plain links only, no
  Cal.com embed — an embed would add third-party script to every page and
  need a CSP change.

## 2. Done this arc

**Design system**
- Light theme tokens: bg `#FFFFFF`, surface `#F5F5F5`, text `#111111`,
  muted `#555555`, divider `#E5E5E5`, border `#767676`, accent `#F5C842`.
- Gold is decoration only. Built CSS contains zero `color: var(--color-accent)`
  declarations — heading rules, blockquote borders, hexagon strokes and link
  underlines only.
- Fraunces (400/600, latin, 35 KB preloaded) for h1/h2; Inter for body/UI;
  system mono for figures and queries; Inter-tracked-muted as caption voice.
- Hexagon motif in exactly six places: hero cluster, proof-bar icon frames,
  method comb cells, team avatars, image-slot watermark, favicon/OG monogram.
- Bee mark twice: header (wing-flap on hover, CSS only) and the 404.
- Micro-interactions: card lift, gold underline slide on the primary CTA,
  60ms grid stagger. All inside `MotionConfig reducedMotion="user"`.

**Structure and content**
- Five services, canonical order in `serviceRouteKeys` (`src/lib/routes.ts`):
  AI Consultancy · AI Search Visibility & SEO · AI Automation ·
  Web Development · Software Development.
- `/services/local-seo` → 308 → `/services/ai-search-visibility`
  (`next.config.ts`).
- Pricing published: audit **$2,500 fully credited**; retainers **$2,500/mo**
  search visibility, **$1,800/mo** operation, **$1,200/mo** care; builds from
  **$7,500** automation, **$6,000** web; software **$15,000–$45,000** after
  audit. Free scan **$0**.
- Founding banner reads "7 of 10 spots open". The `7` is
  `pricing.founding.spotsOpen` — **hand-edited, no live counter by design**.
- Demonstration blocks vary per service: annotated case rail, instruction card
  with time chip, worked calculation (tabular-nums), verifiable checklist,
  prose. Passed to `ServiceTemplate` as a slot.
- Featured research section parked (component kept, not rendered) until
  `/research` has content.

**Engineering**
- RSC payload narrowed: `MobileNav` and `LeadForm` take only the strings they
  render. Served HTML dropped ~28–33 KB per page.
- `src/styles/tokens.test.ts` fails the run if a width utility resolves to the
  spacing scale. See §6.
- Banned words (CLAUDE.md rule 15): empower, leverage, unlock, transform,
  harness, cutting-edge, innovative, world-class, "solutions" as a noun.
  Currently zero occurrences.
- Em-dash policy: max one per paragraph; clause-joining dashes become periods.

**Backend (Phase 4)**
- Three routes, all `runtime: "nodejs"` + `force-dynamic`: `/api/lead`,
  `/api/subscribe`, `/api/chat`. Every one is rate-limited and re-validates
  server-side before touching anything external.
- `/api/lead` answers 200 even when the insert fails. `createLead` emails the
  enquiry first, so the lead survives and the visitor is not shown an error
  (hard rule 6). The success payload carries an `id` only when a row exists.
- The honeypot (`website_url`) is checked against the raw body *before*
  validation, so a trapped submission is indistinguishable from a successful
  one whatever else it contained.
- `/api/chat` proxies `claude-haiku-4-5-20251001`, max_tokens 400, streaming.
  10/min and 100/day, both must pass. History capped at 20 turns / 2000 chars
  per turn / 20,000 chars total, trimmed oldest-first. `role: "system"` from a
  client is refused, not stripped. Provider errors stream the dictionary
  fallback line as a normal 200.
- The chat system prompt is composed from the dictionary (`lib/chat-prompt.ts`),
  so the published price card stays the single source of truth and the
  assistant cannot quote a withdrawn number.
- Background work goes through `lib/after-response.ts` — `waitUntil` on Vercel,
  awaited elsewhere. Without it a serverless freeze can drop a lead alert.
- Chat widget is lazy: the launcher ships in the page bundle, the panel and the
  Supabase browser client arrive on first open. Consent capture is explicit —
  the detector only reveals the form, never fills or submits it.
- First-load JS on `/` grew 148,460 → 151,479 bytes gzipped (+2.95 kB):
  chat launcher ~1.8 kB, newsletter form ~1.2 kB. The lazy panel chunk is
  3,647 bytes gzipped and is **not** in first load.

## 3. Infra facts

**Supabase** — project `nahltech-web`, ref `posdwhozfmlofsvqfohn`,
org `yhkazuzdlcaqgealmjjp`, us-east-1 (N. Virginia), Postgres 17.6.

- **Region migration, 11 Aug 2026.** The database moved from us-west-2
  (Oregon) to us-east-1. The old Oregon project, ref `gakoxloiwlgrhmzvelwt`,
  was **deleted** — that ref is dead and survives only in git history.
  Anything still pointing at it will fail to resolve, not silently read
  stale data.
- Migrations `0001_initial_schema.sql` and `0002_service_enum.sql` are
  committed **and applied to the live database** — re-applied to the new
  project from scratch and verified 11 Aug 2026. The target was confirmed
  empty (0 public tables) before the first write.
- `service_interest` has **8** values: ai_search_visibility, local_seo,
  web_development, ai_automation, unsure, other, ai_consultancy,
  software_development. (`local_seo` retained — Postgres cannot drop an enum
  value without recreating the type.)
- `lead_source` 8 values · `lead_status` 7 values.
- RLS enabled on all 7 tables. Verified live:
  - `anon` SELECT: **false on every table**.
  - `anon` INSERT: true on `chat_conversations` and `chat_messages` only.
  - 2 policies total, both INSERT, both on the chat tables.
- No anon SELECT means `INSERT ... RETURNING` is unavailable to the browser —
  the chat client must generate its own UUIDs.

**Vercel** — project `nahltech-web`, team `nahl-technologies-projects`.

- All seven env vars are set and exercised in production: the Supabase trio,
  `ANTHROPIC_API_KEY`, `RESEND_API_KEY` and the Upstash pair. Verified by a
  live lead insert through the deployed `/api/lead`.
- Resend still reports `The nahltech.com domain is not verified`, so alert
  emails record `status='failed'` in `notification_log`. Expected, not an
  incident: the lead is stored either way and the route never surfaces it.
  Verifying the domain is the only step needed to turn alerts on.
- SSO protection on all deployments except custom domains, so per-deployment
  URLs 302; the `nahltech-web.vercel.app` alias is public.

## 4. Next

**Phase 5 — SEO and launch:** schema.org via `lib/schema-org.ts`, hreflang
(en only), redirect map, Lighthouse gate, Crawlmouse gate, domain cutover.

## 5. Outstanding — founder side

- Legal page copy (privacy, terms, DPA). Only remaining placeholders.
- Team photos for `/about` (currently neutral glyphs; no stock photography).
- Logo asset (header uses a typeset wordmark + bee mark).
- Hafsa Sastho Play Store URL — expected 1 Sept 2026. `productLinks.hafsaSastho`
  is `null`, so the "Try it live" button is omitted rather than broken.
- Keyword Planner data for the content plan.

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
  `engine-strict=true` so this now fails at install.
- **Middleware runs on `/api/*`.** It returns early for them, but anything
  added to the locale logic must keep that early return — without it the
  rewrite sends API calls to `/en/api/*`, which does not exist, and all three
  routes answer 500.

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
