# SESSION-STATE

Handoff snapshot; update at the end of every session. **Last updated:**
16 August 2026 · HEAD `204ae97` · build complete through the security gate ·
CC-CHAT-2 and the team photos shipped · 282 tests passing

## 1. Status

**The build is COMPLETE through the security gate.** Live at
**https://nahltech-web.vercel.app**. HEAD `204ae97` · 137 commits ·
**282 tests passing** · first-load JS **143.7 kB gz** against a 145 kB ceiling
(1.3 kB headroom — it will bite).

Everything is shipped: foundation, six page templates, the design pass, five
service pages, all approved copy, published pricing, the backend (three API
routes, lead alerting, chat widget), the MDX blog and research pipelines, the
legal pages, full schema.org coverage, GA4, the performance pass, the launch
gates and the security gate.

- CI green on `main` (lint · typecheck · test · build, Node 22).
- Placeholders in `en.json`: **0**. Every string is approved copy.
- `npm audit --omit=dev`: **0 vulnerabilities**.
- Booking live: `routes.bookingUrl` → `https://cal.com/udaay-nahltech/intro-call-15-min`.
  Plain external links only; no Cal.com embed.

**Security — CC-SEC-1 is done.** `docs/SECURITY.md` is the posture document,
written to be read by a client as well as a maintainer.

- **Headers verified on production**, not just in config. Two real defects were
  found that way and fixed: HSTS was shipping `preload` (removed — see §5), and
  every JS/CSS bundle was shipping without `nosniff`, because the middleware
  matcher excludes `_next/static`. `next.config.ts` now sets the static
  baseline; the middleware keeps the per-request CSP.
- **Migration `0003_security_hardening.sql` applied**, pinning `search_path` on
  `touch_updated_at()`. The function reports `search_path=public, pg_temp`.
- **Secrets sweep clean.** All 58 emitted chunks, by key name and by actual
  value: zero hits. Git history clean on every pattern — nothing has ever been
  committed, so no history rewrite is needed. The sweep carries a positive
  control (the public anon key and the GA ID *are* found), because "0 hits"
  from a broken grep proves nothing.
- **`/.well-known/security.txt` live**, as a route so its mandatory `Expires`
  is recomputed each build rather than depending on someone remembering.
- **The five `rls_enabled_no_policy` INFO lints are intentional deny-all** and
  must not be "fixed". RLS on with zero policies denies everything to `anon`;
  RLS cannot restrict columns, so any anon SELECT policy on `leads` would
  expose every column to the anon key that ships in the browser. Read
  `docs/SECURITY.md` before touching one.

**Design invariants.** Gold (`#F5C842`) decorates only — never a fill or text
colour. Hexagon motif in exactly six places; the team avatars are one of them,
and since 16 Aug they hold real photographs rather than glyphs. **Two faces
ship on this site, both on `/about`, and nowhere else** — not in schema, not in
an OG image, not on a GBP asset. **Bee mark in one place only — the 404.** The
header carried a second until the official hex logo landed on 13 Aug 2026; that
is the intended final state, not a regression to undo.
Fraunces h1/h2, Inter body. Motion inside `MotionConfig reducedMotion="user"`,
now nested in `LazyMotion … strict` — use `m.*`, never `motion.*`, or it throws.

## 2. Content state

**Blog — 10 files, 8 published.** Pipeline: `content/blog/*.mdx` →
`src/lib/blog.ts` (zod frontmatter plus build-time gates) →
`next-mdx-remote/rsc`. Rules live in `docs/blog-content-conventions.md`.

| Cluster | Count | Notes |
| --- | --- | --- |
| `decision` | 5 published | P1–P5, the SEO cluster |
| `field-notes` | 3 published | migrated, revised |
| `brand` | 2 **`draft: true`** | withdrawn 13 Aug; both slugs 308 to `/about` |

The two brand posts are withdrawn, not deleted — the files stay, and
`next.config.ts` redirects both old URLs so nobody holding a link hits a 404.
Reversible in one edit.

**Research — 5 artifacts, all live.** `content/research/*.mdx` →
`src/lib/research.ts`. Exempt from the blog's sibling-link and offer-link gates
(they cross-reference each other by hand already); link *resolution* is not
relaxed. Hub order is by kind, not date:

1. `crawlmouse-dataset-report` — **the flagship, featured on the home page.**
   Original data from 187 sites; carries `Dataset` schema
2. `how-we-measure` — the methodology, the spine every engagement points at
3–5. the three sample engagements — Kestrel, Redbud, Limestone. All three
   carry the fictional-client disclosure banner above the h1, before any number

**All gates green.** Banned words: clean (one approved exception — a quoted
"digital transformation" that the sentence rejects; see CLAUDE.md rule 15).
Duplicate anchors: **0** on article targets, enforced by `npm run crawl:check`,
which exits non-zero. Sibling links: zero NOTICEs. Placeholders: **0**.
Orphans **0**, max depth **2**, broken links **0**.

## 3. Chat state

**CC-CHAT-1 is live.** `src/lib/chat-prompt.ts` holds the behaviour spec as
ordered rules, lower number winning: understand first (one clarifying question
before proposing anything), price discipline (never volunteer money; when asked
directly, answer completely, lead with the free path, and state the 90-day
credit every single time the $2,500 audit appears), free-first laddering, one
gentle capture offer that is never repeated after a decline, and the standing
guardrails — no invented facts, no guarantees, no negotiation beyond the
published card, no competitor talk, no prompt disclosure.

Facts are composed from the dictionary, so the assistant cannot quote a price
the site stopped showing. 27 prompt tests assert the instructions and the
composition; they cannot assert behaviour, which is what `docs/CHAT-QA.md`
exists for.

**CC-CHAT-2 is live.** Both defects are fixed and verified against the
production model, not against tests alone.

- **(a) Markdown** — the prompt now opens with a format section that outranks
  the numbered rules and forbids markdown by name. 22 model trials across every
  scenario produced none. `src/lib/chat-format.ts` scrubs stray `**` and bullet
  markers on display as a backstop, and the panel renders with
  `whitespace-pre-line` so the blank line between paragraphs survives.
- **(b) Capture** — the model ends a message with `[[LEAD_FORM]]` and the panel
  opens the form under it, name field focused. Fired 8 of 8 where expected
  (offer accepted, person requested, need qualified) and 0 of 2 on a greeting.
  The token is stripped from the display, the `chat_messages` row, and the
  history replayed next turn, so it never comes back as the model's own past
  behaviour.

Three paths reach the form, first one wins: the token, a dismissible chip above
the input at three visitor messages, and the CC-5 contact-details regex.

**Two things to watch, neither claimed as fixed.** A broad price question still
adds a third "from" figure beyond the two the format section allows in roughly
three runs of four — every other part of that answer is right. And the
one-question rule, which measured 3 of 3 on the CC-CHAT-1 prompt, measured 5 of
6 after the format section was added; it was restated inside the format section
to claw that back. Both are recorded in the CHAT-QA run table.

**Two prompt edits were tried and backed out**, recorded so they are not tried
again: an explicit 90-word allowance for price answers read as a target and
pushed replies to 110 words, and naming retainers in order to exclude them made
the model mention them. The length rule is bounded by shape now, not by a
second number.

## 4. Next, in order

1. **Founder runs the two remaining CHAT-QA scenarios against production** — 6
   (discount) and 7 (prompt extraction). Neither is touched by CC-CHAT-2, and
   both need sequenced turns. Scenarios 1–5, 4b and 8 were run on 16 Aug; the
   results table is at the foot of `docs/CHAT-QA.md`.
3. **CUTOVER** — `docs/CUTOVER.md`, founder-executed, Northwest DNS panel.
   **Read §0 first:** `nahltech.com` is already on Vercel, serving the old site
   from a project **not in this team**, and Vercel will not let `nahltech-web`
   claim a domain another project holds — so the domain must be released there
   *before* any DNS change, or the outage is spent hunting for the old project.
   The runbook also carries the do-not-touch list: nine mail and verification
   records (Outlook MX, SPF, `MS=`, Google verification TXT, `send.` MX/SPF,
   `resend._domainkey`, `_dmarc`, `autodiscover`).
4. **Same-day post-cutover checklist:**
   - Submit the sitemap in Google Search Console (already verified — the TXT
     record stays, so no re-verification) and in Bing Webmaster Tools
   - Update the Google Business Profile cover
   - Live-domain smoke test: apex 200 with the new title, `www` redirecting,
     both padlocks valid, one contact-form submission confirming the alert mail
   - Re-run Crawlmouse on the live domain and claim it via DNS

## 5. Outstanding — founder side

- ~~Team photos for `/about`~~ — **landed 16 Aug 2026.** Both founders now
  carry a 56px hex avatar beside their name, built by `npm run build:team`
  from originals kept in gitignored `.work/`. The photographs appear on that
  row and nowhere else, asserted by `team-photos.test.ts`. Samia Zaman is
  still not on the page, so her author entry still has no `/about` URL and no
  photo; anyone without a registry entry keeps the neutral glyph.
- **Keyword Planner hour.** The `field-notes` and `decision` target keywords
  were assigned without Planner data and are marked unvalidated.
- **Counsel review of the legal pages.** An in-house startup baseline, shipped
  on the explicit understanding that it is revised on review.
- **Review-outreach messages** — drafting and sending.
- **Add HSTS `preload` after cutover.** Shipped without it on purpose: it
  declares the apex and every subdomain HTTPS-only effectively forever, and
  `www` does not resolve over TLS today. Once cutover is done and `www` is
  clean, add `; preload` in BOTH `next.config.ts` and `src/middleware.ts` —
  the two values are asserted equal by test.
- **Re-pull the Supabase advisor** to confirm the
  `function_search_path_mutable` WARN is gone. The migration is applied and
  verified; the advisor pull itself is founder-side.
- **GBP geo coordinates.** `LocalBusiness` ships without `geo` by decision —
  the Google Business Profile pin is the authority and a city centroid would
  sit ten miles from the street address in the same block. Send the exact
  lat/long and it takes one line.
- **`chat_lead_saved` is still unverified in GA.** CC-CHAT-2's lead lifecycle
  ran the code path that fires it — a real chat lead was saved end to end — but
  the run confirmed the database rows, not that the event reached GA4. Watch
  for it in realtime on the next chat lead.
- **End-to-end alert proof.** `notification_log` records `status='sent'`, which
  means Resend accepted it — not that it landed. Confirmed again by the
  CC-CHAT-2 lead lifecycle on 16 Aug, which is the same evidence and the same
  gap. Worth opening the inbox once and confirming a CHAT QA TEST alert with
  your own eyes.
- **Per-post OG images** via the file convention; also clears the one remaining
  non-critical Rich Results flag, `Missing field "image"`.
- **Rich Results Test on the live domain**, post-cutover. Structured data has
  been verified structurally and by test, but not through Google's own tool.
- **Hafsa Sastho Play Store URL** — expected 1 Sept 2026.
  `productLinks.hafsaSastho` is `null`, so the "Try it live" button is omitted
  rather than broken.

## 6. Infra facts

**Supabase** — project `nahltech-web`, ref `posdwhozfmlofsvqfohn`,
org `yhkazuzdlcaqgealmjjp`, us-east-1 (N. Virginia), Postgres 17.6.

- Migrations `0001`, `0002` and `0003` committed and applied via psql against
  `SUPABASE_DB_URL`. RLS on all 7 tables. No test data left: every probe row
  is deleted after use.
- `0003_security_hardening.sql` pinned `search_path` on `touch_updated_at()`;
  the function now reports `search_path=public, pg_temp`. The five
  `rls_enabled_no_policy` INFO items are the intended deny-all posture — see
  `docs/SECURITY.md` before ever "fixing" one.
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

## 7. Known quirks

- **Chat prompt changes must be re-verified against the PRODUCTION model,
  never against tests alone.** The tests assert the prompt text; they cannot
  assert what the model does with it, because the model is mocked in CI on
  purpose. CC-CHAT-1 shipped two defects that only the live model revealed:
  a direct price question got a clarifying question instead of the numbers
  (rule 1 was outranking rule 2), and build pricing led with the typical band
  instead of the published "from" figure. Both passed every test. Run the
  scenarios in `docs/CHAT-QA.md` against a deployment after any prompt edit.
- **Readiness probes for server-only changes must use the deployment API,
  not a response heuristic.** A prompt or API change leaves the HTML
  identical, so polling the page for a marker passes against the *old*
  build. This produced a false "live" reading three times. Check the Vercel
  deployment state for the commit SHA, or poll for a string unique to the
  change.
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

## 8. Process rules

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
