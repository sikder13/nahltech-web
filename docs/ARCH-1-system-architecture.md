# ARCH-1 — nahltech.com System Architecture & Design

**Version:** 1.0 · July 30, 2026
**Repo:** `nahltech-web` (new) · **Database:** new Supabase project on company account
**Consolidates:** A1 (IA), A2 (schema) + frontend/backend system design
**This is the reference document for the entire build. Every Claude Code prompt derives from it.**

---

# 1. SYSTEM OVERVIEW

```
                        ┌──────────────────────────────────────────┐
                        │              VISITOR                     │
                        │   (Google / AI referral / outreach /     │
                        │    Crawlmouse referral / direct)         │
                        └────────────────┬─────────────────────────┘
                                         │ HTTPS
                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         VERCEL (Edge Network)                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    NEXT.JS 15 APP (nahltech-web)                 │  │
│  │                                                                  │  │
│  │  ┌────────────────┐   ┌─────────────────┐   ┌────────────────┐  │  │
│  │  │  STATIC/ISR    │   │  API ROUTES     │   │  MIDDLEWARE    │  │  │
│  │  │  pages (RSC)   │   │  /api/chat      │   │  locale        │  │  │
│  │  │  blog (MDX)    │   │  /api/lead      │   │  rewrite,      │  │  │
│  │  │  sitemap,      │   │  /api/subscribe │   │  security      │  │  │
│  │  │  robots, OG    │   │  (rate-limited) │   │  headers       │  │  │
│  │  └────────────────┘   └────────┬────────┘   └────────────────┘  │  │
│  └───────────────────────────────┼───────────────────────────────── ┘  │
└──────────────────────────────────┼─────────────────────────────────────┘
                    ┌──────────────┼──────────────────┐
                    ▼              ▼                  ▼
        ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐
        │   SUPABASE    │  │  ANTHROPIC   │  │     RESEND       │
        │  (company     │  │     API      │  │  (transactional  │
        │   account)    │  │  (chatbot)   │  │     email)       │
        │               │  └──────────────┘  └──────────────────┘
        │  Postgres+RLS │
        │  Edge Fns ────┼──── notify-new-lead ──► Resend + SMS
        │  pg_net       │
        └───────────────┘

        SUPPORTING: GitHub (repo+CI) · Cal.com (booking) · GA4 + GSC
        + Bing Webmaster (analytics) · Upstash Redis (rate limiting)
```

**Design stance:** static-first. Every page that *can* be static **is** static (SSG/ISR). Dynamic behavior lives in three narrow API routes and one Edge Function. This gives world-class Core Web Vitals by default, minimal attack surface, and near-zero hosting cost.

---

# 2. TECH STACK (LOCKED)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15, App Router, RSC** | SSG/ISR, metadata API, image optimization, edge middleware |
| Language | **TypeScript, strict** | Non-negotiable for a showcase repo |
| Styling | **Tailwind CSS** + design tokens ported from current site | Keep the visual identity |
| Motion | **Framer Motion** (existing), gated by `prefers-reduced-motion` | Keep the feel |
| Content | **MDX files in-repo** (`content/blog/*.mdx`) | Blog is versioned, PR-reviewed, no CMS cost or latency |
| DB | **Supabase Postgres** (company account) | RLS, Edge Functions, generous free tier |
| Email | **Resend** | Free tier 100/day — plenty |
| Chat AI | **Anthropic API** (server-side only) | The chatbot |
| Rate limiting | **Upstash Redis** (free tier) | Protects /api/chat and /api/lead |
| Booking | **Cal.com** (free tier, embedded) | Instant booking = primary CTA |
| Hosting | **Vercel** | Existing account, preview deploys |
| Post-response work | **`@vercel/functions`** (`waitUntil`) | Added in Phase 4. A serverless function can be frozen the moment it responds, so an un-awaited lead alert is not guaranteed to send — a silently dropped alert is the exact failure hard rule 6 exists to prevent. Guarded import; off Vercel the work is awaited instead (`lib/after-response.ts`) |
| CI | **GitHub Actions** | lint + typecheck + build on every PR |
| Analytics | **GA4 + GSC + Bing Webmaster + Vercel Analytics** | All free |

**Explicitly rejected:** CMS (Sanity/Contentful — cost + complexity for a 2-person team; MDX in git is more "engineering showcase" anyway), any ORM (Supabase client is enough), Redux/Zustand (RSC + minimal client state), separate backend service (API routes suffice at this scale).

---

# 3. REPOSITORY STRUCTURE

```
nahltech-web/
├── .github/workflows/ci.yml          # lint, typecheck, build, on PR
├── .husky/pre-commit                 # lint-staged + tsc
├── content/
│   └── blog/                         # MDX posts, frontmatter-validated
├── public/
│   ├── images/                       # optimized, <500KB each, NO video/APK
│   └── fonts/                        # self-hosted (no Google Fonts request)
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx            # html lang + dir (rtl for ar)
│   │   │   ├── page.tsx              # home
│   │   │   ├── services/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [service]/page.tsx
│   │   │   ├── products/  (hub, crawlmouse, hafsa-sastho)
│   │   │   ├── pricing/page.tsx
│   │   │   ├── research/  (hub, [slug])
│   │   │   ├── blog/      (hub, [slug])
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   └── legal/     (privacy, terms, dpa)
│   │   ├── api/
│   │   │   ├── chat/route.ts         # rate-limited Anthropic proxy
│   │   │   ├── lead/route.ts         # server-side lead insert
│   │   │   └── subscribe/route.ts
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── opengraph-image.tsx       # file convention, never static path
│   │   └── icon.tsx
│   ├── components/
│   │   ├── layout/      (Header, Footer, MobileNav, LocaleSwitcher)
│   │   ├── conversion/  (BookCallButton, ChatWidget, LeadForm,
│   │   │                 NewsletterForm, PhoneLink, WhatsAppButton)
│   │   ├── blocks/      # section-level: Hero, ProofBar, PricingTable,
│   │   │                # FaqBlock, StatBlock, CtaBlock…
│   │   ├── seo/JsonLd.tsx            # schema.org injector
│   │   ├── templates/   # the six page templates: Home, Service,
│   │   │                # Product, Article, Hub, Legal — each a fixed
│   │   │                # composition of blocks, so the four service
│   │   │                # pages share one anatomy
│   │   └── ui/          # primitives: Button, Card, Input…
│   ├── lib/
│   │   ├── supabase/    (client.ts, server.ts, types.ts)
│   │   ├── leads.ts                  # createLead() with zod validation
│   │   ├── blog.ts                   # MDX loader + frontmatter schema
│   │   ├── schema-org.ts             # JSON-LD builders per template
│   │   ├── i18n/        (config.ts, dictionaries/)
│   │   └── rate-limit.ts             # Upstash wrapper, fail-open
│   ├── styles/globals.css            # tokens as CSS custom properties
│   └── middleware.ts                 # locale rewrite + security headers
├── supabase/
│   ├── migrations/                   # numbered SQL, source of truth
│   └── functions/notify-new-lead/
├── CLAUDE.md                         # Claude Code project instructions
├── .env.example
└── package.json
```

**Two structural rules with teeth:**
1. `supabase/migrations/` is the schema's source of truth — the dashboard SQL editor is for verification only. Schema changes go through numbered migration files in the repo, so the database is reproducible and reviewable like code.
2. `CLAUDE.md` at repo root carries the project conventions so every Claude Code session inherits them without re-prompting (content provided in SETUP-1).

---

# 4. DATA FLOW DIAGRAMS

## 4.1 Lead capture (the money path)

```
 Visitor fills form (5 fields max)
        │
        ▼
 [Client] zod validate ──fail──► inline field errors, no network call
        │ pass
        ▼
 POST /api/lead
        │
        ├─► Upstash rate limit (10/min/IP) ──exceeded──► 429, friendly retry
        │
        ├─► zod re-validate server-side (never trust client)
        │
        ▼
 supabase (SERVICE ROLE, server only) → insert into leads
        │                                      │
        │                              [DB trigger fires]
        │                                      │
        │                                      ▼
        │                       Edge Fn notify-new-lead
        │                          ├─► Resend → info@nahltech.com
        │                          ├─► SMS → founder phone
        │                          └─► insert into notification_log
        ▼
 200 { ok } ──► UI success + Cal.com booking prompt
                ("Want to skip the wait? Book a slot now")

 FAILURE RULE: insert fails → log server-side, still return success UI,
 fire a fallback email with the form payload so the lead is never lost.
```

**Design decision — forms post to `/api/lead`, not directly to Supabase from the browser.** The anon key still exists for the chat widget's conversation logging, but the lead path goes server-side so we get rate limiting, server validation, and the service role — and the browser bundle never needs insert access to `leads` at all. This is tighter than A2's original design; A2's grant of anon INSERT on `leads` is dropped.

## 4.2 Chat widget

```
 Visitor opens widget
        │
        ▼
 create chat_conversations row (anon INSERT), session_id in sessionStorage
        ▼
 user message ──► POST /api/chat
        │              ├─► rate limit (10/min, 100/day per IP)
        │              ├─► validate: msg ≤1000 chars, history ≤20 turns,
        │              │             roles user|assistant only, strip extras
        │              ├─► system prompt (server-side constant):
        │              │     goal = qualify + capture, offer booking link,
        │              │     never promise results, never invent facts,
        │              │     hand off to human for pricing negotiation
        │              └─► Anthropic API (streaming)
        ▼
 stream to UI ──► log both turns to chat_messages (anon INSERT)
        │
        ▼
 IF visitor shares name/email/phone in conversation:
    widget shows explicit "Save my details & have them call me" button
    ──► POST /api/lead (source='chat_widget', conversation linked)
    (consent-explicit: we never silently scrape contact info from chat)
```

## 4.3 Static content pipeline

```
 MDX in content/blog/ ──build──► frontmatter zod-validated
        │                        (title, description, date, author,
        │                         targetKeyword, cluster, serviceLinks[])
        ▼
 fail build on: missing fields · missing internal links per A1 §4.3
        ▼
 SSG page + auto JSON-LD Article + sitemap entry + OG image
```

**The internal-linking rules from A1 are enforced at build time**, not by convention. A post that doesn't link to a service page and two siblings fails CI. That's how "zero orphans" stays true after launch, when content is added weekly under time pressure.

---

# 5. PAGE GRAPH (internal link topology)

```
                                  ┌──────────┐
                        ┌────────►│   HOME   │◄───────────┐
                        │         └────┬─────┘            │
                        │   ┌──────────┼──────────────┐   │
                        ▼   ▼          ▼              ▼   │
                  ┌─────────┐  ┌────────────┐  ┌─────────────┐
                  │SERVICES │  │  PRODUCTS  │  │  RESEARCH   │
                  │  hub    │  │    hub     │  │    hub      │
                  └────┬────┘  └──────┬─────┘  └──────┬──────┘
       ┌───────┬───────┴┬────────┐    │               │
       ▼       ▼        ▼        ▼    ▼               ▼
 ┌──────────┐┌───────┐┌───────┐┌──────────┐   ┌──────────────┐
 │    AI    ││AI SRCH││   AI  ││   WEB /  │   │ INDY REPORT  │
 │CONSULTNCY││ + SEO ││  AUTO ││ SOFTWARE │   └──────┬───────┘
 └────┬─────┘└───┬───┘└───┬───┘└────┬─────┘          │
      │          │        │         │                │
      │          │        │         │    ┌───────────┘
      │          │        │         │    ▼
      │          │        │         │  ┌──────────┐
      │          │        │         │  │CRAWLMOUSE│◄─┐
      │          │        │         │  └────┬─────┘  │
      │          │        │         │       ▼        │
      └──────────┴───┬────┴─────────┘  crawlmouse.com│
                     ▼                   (external, ─┘
                ┌──────────┐              reciprocal)
                │ PRICING  │
                └────┬─────┘
                     ▼
                ┌─────────┐        ┌──────┐
                │ CONTACT │◄───────│ BLOG │──► every post: 1 service link,
                └─────────┘        └──────┘    2 sibling links, pillar link

 Service pages (5), in nav order:
   /services/ai-consultancy         · /services/ai-search-visibility
   /services/ai-automation          · /services/web-development
   /services/software-development
   /services/local-seo 301s to /services/ai-search-visibility.
```

Rules (build-enforced): zero orphans · max depth 3 from home · descriptive anchors · every service page → pricing + ≥1 product + ≥2 posts.

---

# 6. SECURITY MODEL

```
BROWSER can:                        BROWSER can NEVER:
  • read static pages                 • hold service role key
  • POST /api/lead|chat|subscribe     • SELECT any table
  • INSERT chat rows (anon)           • see the Anthropic key
                                      • reach the DB for leads directly

SERVER holds: SUPABASE_SERVICE_ROLE_KEY · ANTHROPIC_API_KEY ·
              RESEND_API_KEY · UPSTASH tokens
  → all in Vercel env vars, all absent from the client bundle,
    enforced by `import 'server-only'` in lib/supabase/server.ts

DB: RLS on every table · anon = INSERT-only on the two chat tables ·
    zero anon SELECT policies (deliberate — RLS can't restrict columns)

HEADERS (middleware): CSP, X-Frame-Options DENY, X-Content-Type-Options,
    Referrer-Policy strict-origin-when-cross-origin, HSTS

RATE LIMITS: /api/chat 10/min + 100/day per IP · /api/lead 10/min ·
    fail-open on Redis outage (availability > strictness for a lead form)
```

Every line above is a lesson from the old site's audit: hardcoded keys, an anon SELECT-all policy, and an unlimited AI proxy. The new architecture makes each of those *structurally impossible*, not just avoided.

---

# 7. SEO & PERFORMANCE ARCHITECTURE

**Rendering:** all marketing pages SSG · blog ISR (revalidate 3600) · zero client-side data fetching on any indexable page.

**Schema.org per template** (via `JsonLd` component, builders in `lib/schema-org.ts`):

| Template | JSON-LD |
|---|---|
| All pages | Organization + WebSite (root layout) |
| Home, Contact | LocalBusiness (NAP matches GBP exactly) |
| Service pages | Service + Offer (published prices) + FAQPage |
| Blog/Research | Article + BreadcrumbList + Person (author) |
| Pricing | OfferCatalog |
| Products | SoftwareApplication (Crawlmouse and Hafsa Sastho) |

All of the above shipped in Phase 5. Two deliberate absences: `LocalBusiness` carries no `geo` (the authoritative pin is the Google Business Profile's, added post-cutover — a city centroid would sit ten miles from the street address in the same block), and `WebSite` carries no `SearchAction` (the site has no search endpoint to point one at). **No `aggregateRating` is emitted anywhere, on any type, ever** — there is no review corpus to aggregate, and the invariant is enforced by test rather than convention.

**Metadata:** per-page `generateMetadata` · title template `%s | Nahl Technologies` · OG via file convention (`opengraph-image.tsx`) — never a static path (the old site's `/og-image.png` 404s on X today).

**hreflang:** emitted only for locales with live content (en only at launch — ar/bn added when content ships; hreflang pointing at 404 locales is an SEO error).

**Redirects:** seven entries in `next.config.ts`, emitting 308 (permanent, and equivalent to 301 for search engines, which is why the two are not mixed):

| Source | Destination |
|---|---|
| `/services/local-seo` | `/services/ai-search-visibility` |
| `/product` | `/products` |
| `/product/hafsa-sastho` | `/products/hafsa-sastho` |
| `/product/hafsa-shastho` | `/products/hafsa-sastho` |
| `/hafsa-sastho/beta` | `/products/hafsa-sastho` |
| `/about/team` | `/about` |
| `/privacy` | `/legal/privacy` |

This replaces an earlier claim that a "full A1 Part 2 map" was already implemented, which was never true — the file held a single redirect until Phase 5. The set above is the old site's known structure, not an exhaustive export: no URL list from the old site exists. `/hafsa-sastho/beta` is corroborated by the old site's own `robots.txt`, which still disallows it. Any further legacy URL is found the way `CUTOVER.md` describes — Search Console's crawl-error report after cutover — and gets a redirect the same day. The "shastho" misspelling is caught here and nowhere else; no rendered surface uses that spelling.

**Performance budget (CI-checked via Lighthouse):**
LCP < 2.0s · CLS ≤ 0.05 · INP < 200ms · Lighthouse SEO + A11y = 100, Best-Practices ≥ 96, Performance ≥ 95 mobile · fonts self-hosted · images AVIF/WebP via next/image · **JS on marketing pages < 145KB gz** (chat widget lazy-loads on first interaction).

Three of those numbers were revised on 13 Aug 2026, each against a measurement rather than to make a red light go green:

- **JS 120 → 145 KB gz.** Ratified by the founder after the floor below was itemised. 120 KB was set before the framework cost was measured; the locked stack alone is 128 KB. This is a measured revision, not a ratified overage — see the table.
- **Best-Practices 100 → ≥ 96.** 100 is unreachable while the CSP uses `'unsafe-inline'`, and it uses `'unsafe-inline'` because a nonce must be minted per request, which opts every page out of static rendering — the thing the LCP budget above depends on. Chrome's Issues panel flags the allowlist; no actual CSP violation occurs. Accepted as a documented, deliberate trade (`src/middleware.ts` carries the reasoning).
- **`next/image` has two documented exceptions, both measured: the header logo and the `/about` team avatars.** Content imagery goes through `next/image`, as above. The brand mark does not — it is a fixed 24px asset on every page, pre-optimised to a 5 KB WebP by `npm run build:logo`, and `next/image`'s client runtime measured **+5.0 kB gz on every page**, which put first-load over the ceiling to optimise something already optimised. It ships as a plain `<img>` with explicit `width`/`height`, so it still reserves its own space and contributes nothing to CLS.

  **The team photographs were expected to end that exception and did not.** This paragraph previously said so in as many words — that the moment real photography landed on `/about`, it would go through `next/image`. Measured on 16 Aug 2026 when the founders' photographs landed, `/about` builds at **145 kB with a plain `<img>` and 150 kB with `next/image`**, which is over the ceiling. The prediction was wrong because it assumed photography implies unknown dimensions: these render at a fixed 56px, and `npm run build:team` emits exactly the 160px and 320px WebP files that size needs (3.9 kB and 9.6 kB; 2.4 kB and 6.8 kB). `next/image` would have shipped a client runtime to re-derive assets that were already correct. They ship as `<img srcset>` with explicit `width`/`height`.

  So the rule the two exceptions actually share is not "brand assets only" — it is **fixed render size plus a build step that already emits that exact size**. Anything that needs responsive variants, art direction, or a size not known at build time still goes through `next/image`, and a larger portrait on `/about` would be exactly that case.
- **CLS < 0.05 → ≤ 0.05.** Measured 0.050, from Inter swapping in and reflowing one section. The available fix is `font-display: optional` on Inter, and it was **explicitly rejected**: it trades a real user-facing cost — the brand face not rendering at all on a slow first load — for a threshold technicality of 0.0003. Lighthouse Performance passes at 97–98 regardless, and 0.05 is well inside Core Web Vitals' own 0.1 "good" threshold. Do not "fix" this later without re-reading this paragraph.

**First-load JS, measured 11 Aug 2026 at the end of Phase 4:** `/` ships **151.5 KB gzipped**. The chat panel is not in that figure — it lazy-loads on first interaction as a separate 3.6 KB gzipped chunk, which is the target above working as intended.

That number is **over the 120 KB gz target, and was already over before Phase 4**. The same measurement against the Phase 3 tip (`e64bdac`) is 148.5 KB. Phase 4 added 3.0 KB of it: chat launcher 1.8 KB, newsletter form 1.2 KB, everything else 16 bytes. Recording 151.5 KB here as the measured baseline for Phase 5's performance pass to work against — not as a raised ceiling. The 120 KB target stands and is currently unmet by ~31 KB.

Method, so the next measurement is comparable: sum the `.js` entries from `build-manifest.rootMainFiles` plus `app-build-manifest.pages` for `/layout`, `/[locale]/layout` and `/[locale]/page`, gzip each at level 9. CSS is excluded. **This is implemented as `npm run measure:js`** (`scripts/measure-first-load.mjs`) so it is run rather than re-derived.

**Phase 5 measurement, 13 Aug 2026:** `/` ships **143.5 KB gzipped**, down from 153.2 KB at the start of the phase. GA4 added 1.7 KB to the Phase 4 baseline of 151.5 KB; migrating Framer Motion to `LazyMotion` + `m` + `domAnimation` took 9.7 KB back out.

**The original 120 KB target was not reachable on this stack, and the remainder is not application code.** Itemised, and the basis on which the target was moved to 145 KB:

| Item | gz | Reducible? |
|---|---|---|
| React 19 + React DOM + Next client runtime (`rootMainFiles`) | 100.3 KB | No — this is the framework floor |
| Framer Motion (`m` + `domAnimation` features) | 27.7 KB | Only by leaving the locked stack |
| Google Analytics | 4.5 KB | Only by dropping analytics |
| **Everything we wrote** — layout, header, footer, chat launcher, forms, page | **11.0 KB** | Marginal |

The two locked dependencies alone total **128.0 KB**, which is over the 120 KB target before a single line of our own code. Our own code is 11 KB of a 143.5 KB page — roughly 7%. The remaining levers are: loading `domAnimation` asynchronously (moves ~15 KB out of first load, but `FadeIn` renders `opacity: 0` until features arrive, so it trades directly against LCP, currently 1.5–1.7 s against a 2.0 s budget), or dropping Framer Motion, which the stack lock in `CLAUDE.md` forbids. Neither is worth taking unilaterally.

The honest conclusion is that 120 KB was set before the framework cost was measured: shaving our own 11 KB cannot close a 23 KB gap. **The founder ratified 145 KB on 13 Aug 2026** on that basis. The new figure is deliberately only 1.5 KB above the current 143.5 KB — it is a ceiling that still bites if application code grows, not a number chosen to be comfortable. If a future change needs more, measure first and move it again for a stated reason; do not quietly exceed it.

**Launch gate:** site scores well on Crawlmouse. We sell this; our own grade is the first proof any prospect checks.

---

# 8. i18n ARCHITECTURE

- `en` unprefixed (default) · `/ar/` RTL-ready · `/bn/` — both return 404 until real content exists (never machine-translate)
- UI strings in `lib/i18n/dictionaries/{en,ar,bn}.json` from day 1 — even though only `en` ships, every component reads from the dictionary so locale launches become content tasks, not refactors
- `<html lang dir>` set in `[locale]/layout.tsx` · WhatsApp CTA renders only on ar/bn locales (D36)
- Locale-aware sitemap: only live locales listed

---

# 9. WHAT THE BUILD PROVES (the "our website is our portfolio" checklist)

This site doubles as the agency's flagship work sample. A technical prospect who inspects it should find:

- [x] Lighthouse SEO 100 / A11y 100 / Best-Practices 96 / Performance 97–98 mobile, measured 13 Aug 2026 over three runs. Best-Practices is capped at 96 by the CSP trade recorded in §7; the other three are met. (Screenshot goes on /services/web-development — note it should show the real numbers, including the 96, since the whole point of publishing them is that they are checkable.)
- [ ] Excellent Crawlmouse score (screenshot goes on /products/crawlmouse)
- [ ] Rich results passing for every schema type (Google validator)
- [ ] Clean public repo history — conventional commits, PR discipline, CI green
- [ ] Sub-second page loads from any region
- [ ] Working AI chat that actually converts, rate-limited and abuse-proof
- [ ] Instant lead alerting (demo-able live in a sales call: "watch my phone")
- [ ] Zero console errors, zero broken anchors, zero 404s in nav
- [ ] Accessibility: keyboard-navigable, screen-reader tested, WCAG AA contrast

Each checked item is a *sentence we get to say to a prospect.* That is what "world-class" cashes out to — verifiable properties, not adjectives.

---

# 10. BUILD SESSIONS

**CC numbers are session labels, not phase math.** They are assigned in the order sessions actually happen. Do not derive one from the other, and do not infer a session's number from the phase it worked on — several sessions spanned more than one phase, and the numbers are not contiguous.

This table is a record of what was built, kept current as sessions land. It replaces the planned phase→prompt map, which drifted from the first session onward and was still being used to derive labels long after it stopped being true.

| Session | Scope | Status |
|---|---|---|
| **CC-1** | Foundation: scaffold, tooling, CI, i18n routing, tokens, shell | Shipped |
| **CC-2 / CC-2.5** | Six page templates, ui and blocks components, design distinctiveness pass | Shipped |
| **CC-3 / CC-4 / CC-4.x** | All routes, approved page copy, five-service restructure, pricing with published numbers | Shipped |
| **CC-5** | Backend: Supabase wiring, `/api/lead`, `/api/subscribe`, `/api/chat`, lead alerting, chat widget | Shipped |
| **CC-7** | MDX blog pipeline, migration of the five legacy posts, legal pages | Shipped |
| _next_ | SEO and launch: schema.org, sitemaps, perf pass, Crawlmouse gate, domain cutover | Not started |

Each session ends with acceptance criteria Claude Code verifies before the work is accepted — the verification loop.
