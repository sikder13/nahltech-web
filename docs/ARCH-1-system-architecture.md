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
 │AI SEARCH ││ LOCAL ││  WEB  ││    AI    │   │ INDY REPORT  │
 │VISIBILITY││  SEO  ││  DEV  ││   AUTO   │   └──────┬───────┘
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

 Service pages (4): /services/ai-search-visibility · /services/local-seo
                    /services/web-development     · /services/ai-automation
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
| Products | SoftwareApplication (Crawlmouse) |

**Metadata:** per-page `generateMetadata` · title template `%s | Nahl Technologies` · OG via file convention (`opengraph-image.tsx`) — never a static path (the old site's `/og-image.png` 404s on X today).

**hreflang:** emitted only for locales with live content (en only at launch — ar/bn added when content ships; hreflang pointing at 404 locales is an SEO error).

**Redirects:** full A1 Part 2 map in `next.config.js` — every old URL 301s, both hafsa spellings preserved.

**Performance budget (CI-checked via Lighthouse):**
LCP < 2.0s · CLS < 0.05 · INP < 200ms · Lighthouse SEO + A11y + Best-Practices = 100, Performance ≥ 95 mobile · fonts self-hosted · images AVIF/WebP via next/image · JS on marketing pages < 120KB gz (chat widget lazy-loads on first interaction).

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

- [ ] Lighthouse 100 / 100 / 100 / 95+ (screenshot goes on /services/web-development)
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

# 10. BUILD PHASES → PROMPT MAP

| Phase | Scope | Prompts | Model / effort |
|---|---|---|---|
| **1. Foundation** | scaffold, tooling, CI, i18n routing, tokens, shell | CC-1 | Opus 5 / high |
| **2. Templates** | 6 templates + ui/blocks components | CC-2, CC-3 | Opus 5 / high |
| **3. Pages** | all routes, copy in, blog migration, redirects | CC-4, CC-5 | Opus 5 / high |
| **4. Backend** | Supabase wiring, /api/*, alerting, chat widget | CC-6, CC-7 | Opus 5 / **xhigh** |
| **5. SEO + launch** | schema, sitemaps, perf pass, Crawlmouse gate, cutover | CC-8 | Opus 5 / high |

Each prompt ends with acceptance criteria Claude Code must verify before you accept the work — the verification loop. Copy for Phase 3 comes from the page content specs (A5+), which I produce while you run Phases 1–2.
