# SESSION-STATE

Handoff snapshot. Update at the end of every session.

**Last updated:** 11 August 2026 · HEAD `4f36cfb` · 63 commits · 52 tests passing

## 1. Status

Phases 1–3 complete: foundation, six page templates, design distinctiveness
pass, five-service restructure, all approved copy, pricing page with real
published numbers.

- Live: **https://nahltech-web.vercel.app**
- No custom domain attached. Deliberate — cutover is Phase 5.
- CI green on `main` (lint · typecheck · test · build, Node 22).
- Vercel builds on Node 24.x; CI and `.nvmrc` pin 22. Legal under
  `engines: >=22`, but the runtimes differ.
- Placeholders remaining in `en.json`: **2**, both legal.

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

- Env vars set: the Supabase trio (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Not yet set:** `ANTHROPIC_API_KEY`, `RESEND_API_KEY`,
  `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Phase 4 needs these.
- SSO protection on all deployments except custom domains, so per-deployment
  URLs 302; the `nahltech-web.vercel.app` alias is public.

## 4. Next

**Phase 4 — backend** (ARCH-1 §4 and §10):

- `/api/lead` — Upstash rate limit 10/min, zod re-validation server-side
  (reuse `src/lib/lead-schema.ts`), service-role insert, lead-loss fallback
  per hard rule 6. `LeadForm` has a `PHASE-4 TODO` marking the stub.
- `/api/chat` — rate limit 10/min + 100/day, message ≤1000 chars, history
  ≤20 turns, roles user|assistant only, server-side system prompt, streaming.
- `/api/subscribe` — service-role insert, no anon grant.
- `notify-new-lead` Edge Function — Resend + SMS, writes `notification_log`.
- Chat widget, lazy-loaded on first interaction.

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
