# SESSION-STATE

Handoff snapshot; update at the end of every session. **Last updated:**
22 August 2026 · HEAD `b5b9049` · build complete through the security gate ·
**cutover done, `nahltech.com` live** · 369 tests passing

## 1. Status

**The build is COMPLETE through the security gate.** Live at
**https://nahltech.com** since the 17 Aug cutover; the
`nahltech-web.vercel.app` alias still resolves. HEAD `b5b9049` · 163 commits ·
**369 tests passing** · first-load JS **145 kB** on `/about` and `/contact` and
**146 kB** on the five service pages, against a 145 kB ceiling — measured at
this HEAD, breach and remedy in §3b.

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

**Cutover is done.** `nahltech.com` moved onto this project on **17 Aug 2026**
and serves the site; the domain is no longer held by the old project. What is
left of it is the founder-side post-cutover checklist in §4.

**Since that snapshot — 21 Aug, two fixes, one commit each.**

- **`914fce0` — CC BY 4.0 on the dataset.** The `Dataset` node on
  `/research/crawlmouse-dataset-report` now carries
  `license: "https://creativecommons.org/licenses/by/4.0/"`, which clears the
  non-critical `Missing field "license"` Search Console raised against the
  Datasets rich result. Founder decision: the published aggregate data is
  licensed CC BY 4.0. The report states the grant in its own prose in the same
  commit, because Google reads the field against what the page visibly says —
  and the dataset test in `research.test.ts` asserts markup and body carry the
  same URL, so deleting the sentence fails the suite rather than leaving a
  licence nobody is actually granted.
- **`fd36d2a` — author LinkedIn URL.** Udaay Sikder's personal profile moved to
  `https://www.linkedin.com/in/udaaysikder/`. `lib/authors.ts` is the single
  source, so the Person node's `sameAs` and the visible byline both follow from
  that one edit; the three pinned assertions moved with it. The company page in
  `lib/routes.ts` is a different profile and is unchanged.

**Since that snapshot — 22 Aug, one commit: internal linking.**

- **`c189020` — contextual links into the five unindexed URLs.** Search Console
  had five URLs in *Crawled – currently not indexed*: three service pages and
  two posts. The repo audit read it as those pages living on navigation links
  alone, with almost no in-content links pointing at them from anywhere that
  earns impressions.
  - **`/about` gained a "What we actually do" band**, after the sign-off and
    before the founders. Five approved sentences, each opening with the service
    named in the anchor. The order is the copy's, **not `serviceRouteKeys`'**,
    so `aboutServices` is written out in `UtilityTemplates.tsx`; the hrefs
    still come from the route registry, so an anchor cannot outlive the page it
    points at. **Untinted on purpose** — the founders band below is tinted, and
    tinting this one would strand the italic sign-off on a white strip between
    two tints. Do not "fix" it to match.
  - **The two indexed posts carry one approved sentence each**, placed where
    the argument already was rather than bolted on the end.
    `ai-opportunity-audit-worked-example` closes its verdict section by linking
    `/services/ai-automation` and `/services/software-development`;
    `indianapolis-business-chatgpt-visibility` separates a site problem from a
    content problem where it links `/services/web-development`.
  - **The home page needed no edit.** It already links all five service pages
    with the service name as the anchor text.
  - **`lastmod` on those two posts could not be bumped** — the part that is
    not done. Blog frontmatter has no `updatedAt` field (`src/lib/blog.ts`
    carries `date` only) and `src/app/sitemap.ts` reads `date`, the publish
    date. So both posts were edited without any way to signal it, and still
    advertise their original date. Adding the field is a schema and sitemap
    change that was out of that session's scope; it is §4 item 5 now.
  - `/about` measures **145 kB** first-load at this HEAD, on the ceiling with
    `/contact`. Whether the band moved that number was **not** measured — the
    pre-commit figure was never rebuilt, so do not read the two facts as cause
    and effect.

**Then, same day — `eb268f8`, the identity relay (COPY-PACK-1).**

The reason it exists is worth keeping: on 21 Aug ChatGPT described this company
as a social-impact product startup and steered a prospect away from hiring it
as an Indianapolis AI consultant — a verified conversation, not an inference.
Both surfaces a model reads first invited that: the Organization node carried
**no `description` at all**, and `/about` opened on the founder story with the
two products in it.

- **The descriptor leads everything.** `about.intro` (§1) is the About page's
  lead, in the same `PageHeader` `intro` slot contact and pricing use — the
  template's own lead treatment, not a hand-styled paragraph.
- **One string, three surfaces.** `site.description` (§2) is read by the
  Organization node; the home and About meta descriptions carry the same
  characters. `copy-provenance.test.ts` pins the three as identical, so editing
  one and not the others fails rather than drifts.
- **Organization gained `areaServed` and `knowsAbout`.** Eight `Country` nodes,
  ISO 3166-1 alpha-2, the Gulf named country by country because `areaServed`
  takes places and "the Gulf region" is not one. Five subjects in `knowsAbout`,
  each backed by a service page that sells that work. **No `slogan`** — none is
  approved and an invented tagline is a product claim.
- **LocalBusiness carries the same eight countries.** Its old
  `[{City: Indianapolis}, "Worldwide"]` is gone. The locality claim is not:
  `address.addressLocality` is the stronger local signal and the one the
  Business Profile is matched against. NAP verified character-identical.
- **`/about` order is now descriptor → services → story.** The story is
  demoted, not edited. Titles untouched.

**Three things that relay did not do, all recorded in the code itself:**

- **`https://github.com/sikder13` is not in `sameAs`,** and there is a TODO on
  the property saying why. It is a *personal* account, and that node carries
  company profiles only by an explicit and tested decision; and
  `companyProfiles` is built from the footer's own links, so the markup cannot
  claim a profile the site does not link to — and **the site links to GitHub
  nowhere**. A footer link or the founder's Person node would each unblock it.
  This is a founder decision, not a bug (§4 item 6). The other two URLs the
  pack asked for were already there.
- **The Service nodes still carry the old `AREA_SERVED`,** whose "Worldwide" is
  broader than the bounded eight. Not a contradiction, not one voice either
  (§4 item 7).
- **§2 is 171 characters, not the 158 the pack states.** Shipped at its
  supplied length anyway; Google truncates the display around 155-160, so the
  tail after "for businesses across the" is unlikely to render.

**All three were amended the same day — `83643d1`.** The founder answered each
flag rather than leaving it standing, so none of the three is open any more.

- **§2 is now 158 characters and that is what ships**, on all three surfaces.
  Only the third sentence changed: "for businesses across the US, Canada, and
  the Gulf region" became "Serving the US, Canada, and the Gulf region".
- **GitHub is claimed through the footer**, which was option 2. The account
  joined `socialLinks` with a glyph and a label and reaches `sameAs` the way
  the other four profiles do — the invariant that markup cannot claim a
  profile the site does not link held, and the site now links it. The Person
  node and the LinkedIn-only guard in `lib/authors.ts` were not touched.
  The comment on `socialLinks` records where the line now sits: a personal
  LinkedIn is a page *about* Udaay and stays off the company node, while that
  account holds the firm's public code and is its code presence.
- **`AREA_SERVED` is one constant again.** All five Service nodes carry the
  same eight countries, and a test asserts "Worldwide" appears on no node.

**Then RELAY-SEO-3 — AI access, two commits.**

- **`7efa2d8` — `llms.txt` and explicit crawler allows.** See **§6b**, which is
  the policy in one place. Two things worth keeping here: `/robots.txt` is now
  a **route handler**, because the metadata API cannot emit the Content
  Signals comment line — do not restore `robots.ts`. And `public/llms.txt` is
  static but not hand-maintained prose: `llms-txt.test.ts` checks the
  descriptor against `about.intro`, every description against that page's own
  metadata, and every path against the route registry, so a rewritten meta
  description fails the suite rather than leaving the file describing a site
  that no longer exists.
- **`b5b9049` — IndexNow.** Key committed at
  `public/b0b86a7cb959561bc7a1f93b95ea2055.txt`, which is correct: the
  protocol verifies ownership by fetching it. `npm run indexnow` after
  production deploys only, never in the build. 31 URLs in the current sitemap.

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

**Nav order is Services, Products, Pricing, About, Contact.** Research is
deliberately not in the header — it comes out on the founder's call, is still
in the footer's Company column, and is linked from the home page, all five
service pages and the blog. Presentation only: the sitemap URL set is
unchanged and `sitemap.test.ts` pins that separation.

**The header's blur lives on its own layer, not on the `<header>`.**
`backdrop-filter` makes an element the containing block for `position: fixed`
descendants, which was clipping the mobile menu panel to a 49px sliver on
every page — measured 49px with the filter, 780px without. Do not fold it back
onto the header element.

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
   Original data from 187 sites; carries `Dataset` schema, licensed CC BY 4.0
   in the markup and in the closing paragraph of the report itself
2. `how-we-measure` — the methodology, the spine every engagement points at
3–5. the three sample engagements — Kestrel, Redbud, Limestone. All three
   carry the fictional-client disclosure banner above the h1, before any number

**`/about` carries its final approved copy**, reordered 22 Aug: the canonical
descriptor, the "What we actually do" service band, then "Our story", "What we
do", "What we've built", the italic sign-off, and "The founders" with both
photographs. The story is demoted, not edited.

**Both meta descriptions are COPY-PACK-1 §2 as of 22 Aug**, character-identical
to `site.description` and to the Organization node's `description` — one string
on three surfaces, pinned by `copy-provenance.test.ts` so editing one and not
the others fails rather than drifts. It runs to **171 characters**, not the 158
the pack claims, and ships at its supplied length because trimming approved
copy is rewriting it (hard rule 12); Google will truncate the tail. The About
prefix the pack offered was resolved by the pack's own rule — prefixed comes to
196 against a 165 limit, so §2 ships unmodified. Both `metaTitle`s are
untouched, at 65 and 84 characters.

**The Bengali name renders as Bengali.** হাফসা স্বাস্থ্য is wrapped in
`lang="bn"` by `markScriptRuns`, which detects the Unicode block rather than
the phrase, so it survives a copy edit. Inter is subsetted to latin, so
`:lang(bn)` in globals.css names the platform Bengali faces and corrects the
optical size instead of shipping a webfont for two words. This is the
mechanism the bn locale will use when its content exists; do not remove it as
"about-page-specific".

**All gates green.** Banned words: clean, including every string added on
16 Aug — checked across the whole dictionary, not just the new copy. There is
still **no automated banned-word gate**; rule 15 is enforced by grep and by
review, which is worth knowing before trusting "clean" in a future handoff.
One approved exception stands — a quoted "digital transformation" that the
sentence rejects; see CLAUDE.md rule 15.
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

## 3b. Lead capture surfaces

**All five service pages carry an embedded lead form** as of 17 Aug, replacing
the CtaBlock that used to close them. Same `LeadForm` component in `compact`
mode — name, email, message — posting `source='service_page'` (added by
migration **0004**, applied to the live database) with `service_interest` set
from the page by `src/lib/service-interest.ts`. The map is written out rather
than derived: a wrong value is rejected by zod and the lead never arrives.

Three lead surfaces now exist: `/contact` (`contact_form`), the five service
pages (`service_page`), and the chat widget (`chat_widget`).

**The 145 kB budget is breached on those five pages, at 146 kB.** Not absorbed
quietly — ARCH-1 §7 says to measure and report rather than exceed, so here is
the measurement. The form costs ~24 kB, of which **client-side zod is 16 kB**:

| Page | Before | After | Without client zod |
| --- | --- | --- | --- |
| `/services/*` | 122 kB | **146 kB** | 130 kB |
| `/contact` | 145 kB | 145 kB | 129 kB |

`/contact` has always sat exactly on the ceiling for the same reason, so the
number was already load-bearing. The fix is available and measured: LeadForm's
client-side zod pass is documented in its own comment as "a courtesy" with the
route as the enforcement point (hard rule 5), so replacing it with a small
hand-rolled validator would take all six pages well under budget. **That was
not done — it changes the contact form's validation architecture and was
outside the brief. Founder decision.**

## 4. Next, in order

1. **Founder runs the two remaining CHAT-QA scenarios against production** — 6
   (discount) and 7 (prompt extraction). Neither is touched by CC-CHAT-2, and
   both need sequenced turns. Scenarios 1–5, 4b and 8 were run on 16 Aug; the
   results table is at the foot of `docs/CHAT-QA.md`.
3. ~~**CUTOVER**~~ — **done 17 Aug 2026.** `nahltech.com` serves this project.
   `docs/CUTOVER.md` stays as the record, and its do-not-touch list still
   governs any future DNS edit: nine mail and verification records (Outlook MX,
   SPF, `MS=`, Google verification TXT, `send.` MX/SPF, `resend._domainkey`,
   `_dmarc`, `autodiscover`).
4. **Post-cutover checklist — none of it recorded as done here:**
   - Submit the sitemap in Google Search Console (already verified — the TXT
     record stays, so no re-verification) and in Bing Webmaster Tools
   - Update the Google Business Profile cover
   - Live-domain smoke test: apex 200 with the new title, `www` redirecting,
     both padlocks valid, one contact-form submission confirming the alert mail
   - Re-run Crawlmouse on the live domain and claim it via DNS
   - **Request indexing for the five URLs `c189020` linked**, once that commit
     is live. The links are the reason to ask again; asking without them was
     what produced *Crawled – currently not indexed* in the first place.
5. **Blog `updatedAt` → sitemap `lastmod`.** `c189020` edited two published
   posts with no way to say so: `src/lib/blog.ts` validates `date` and nothing
   else, and `src/app/sitemap.ts` emits that as `lastmod`. An optional
   `updatedAt` in the zod frontmatter schema, preferred by the sitemap when
   present, would let an edited post ask for a recrawl. It touches the
   frontmatter contract in `docs/blog-content-conventions.md` and the URL set
   pinned by `sitemap.test.ts`, so it needs a test and a founder nod, not a
   drive-by edit.
6. **Decide where the GitHub profile is claimed.** `eb268f8` was asked to put
   `https://github.com/sikder13` on the Organization's `sameAs` and did not —
   see §1. Three ways out, in preference order: put it on the founder's
   **Person** node, where a personal account belongs (needs the LinkedIn-only
   host guard in `lib/authors.ts` loosened); add a GitHub link to the footer's
   `socialLinks`, which carries it into `companyProfiles` and therefore into
   `sameAs` honestly (needs a `github` glyph in `BrandIcon` and a footer
   label); or decide the claim is not worth making. Founder call.
7. **Align `AREA_SERVED` on the Service nodes** with the eight countries the
   identity nodes now claim, or decide "Worldwide" is the honest value there
   and say so in the constant's comment. One or the other — not both, which is
   what the file says today.

## 5. Outstanding — founder side

- **Vercel Attack Challenge Mode is ON and needs clearing.** Project →
  Firewall. It tripped on 16 Aug during automated QA of the chat and again
  during the team-photo work — repeated scripted requests from one IP are
  exactly what it exists to stop, so this was self-inflicted rather than an
  attack. While it is on, `nahltech-web.vercel.app` answers 403 with a "Vercel
  Security Checkpoint" to scripted clients and, once it escalates, to ordinary
  browsers as well. **Clear it before doing anything else on the live URL, and
  before cutover.** The lesson for future sessions is in §7: verify against a
  local production build and hit the live URL once, rather than polling it.

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
vars set and exercised in production. **The custom domain is live:**
`nahltech.com` cut over to this project on 17 Aug 2026 and the `.vercel.app`
aliases still resolve alongside it. Vercel builds on Node 24.x; `engines` is
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

## 6b. AI access policy

**All Search, Agent and Training crawlers are explicitly allowed.** Not merely
permitted by the wildcard — named, one group each, in `src/lib/robots-txt.ts`.
Twelve of them: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User,
Claude-SearchBot, PerplexityBot, Perplexity-User, Google-Extended,
Applebot-Extended, Bingbot, meta-externalagent. The file also carries
`# Content-Signal: search=yes, ai-input=yes, ai-train=yes` as its first line.

The three jobs are separate and allowing one does not allow the others: a site
can welcome GPTBot and still be absent from the index ChatGPT answers from.
**Bingbot is the load-bearing one** — ChatGPT and Copilot retrieval both run
through Bing's index.

**There are no `Disallow` lines, and adding one is a behaviour change.**
`/api/*` is rate-limited and zod-validated rather than hidden, and
`robots-txt.test.ts` fails if a `Disallow` appears.

**`/robots.txt` is a route handler, not the `robots.ts` metadata convention.**
The metadata API serialises a typed object and cannot emit a comment line,
which the Content Signals declaration is by specification. Do not "restore"
the metadata route — the signals would go with it.

**IndexNow: run `npm run indexnow` after each production deploy.** It is
deliberately not wired into the build, because Vercel builds previews too and
a preview build would submit production URLs for content that is not live.
`npm run indexnow -- --dry-run` prints the payload and sends nothing; a live
run refuses any host that is not production. The key is committed at
`public/b0b86a7cb959561bc7a1f93b95ea2055.txt` and that is correct — IndexNow
verifies ownership by fetching it, so it is public by design, not a leak.

**Cloudflare, if it is ever put in front of this DNS:** Search, Agent and
Training must each be set to **Allow** before proxying. Its September 2026
defaults do not match the policy above, and a proxy that blocks what
`robots.txt` invites is the more expensive half of the contradiction.

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
