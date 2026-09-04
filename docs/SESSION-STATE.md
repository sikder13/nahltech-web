# SESSION-STATE

Handoff snapshot; update at the end of every session. Keep this a **separate
commit from the code it describes** — a commit cannot contain its own hash,
so a snapshot shipped inside the change it documents cannot name it.
**Last updated:**
4 September 2026 · HEAD `ed5235c` · build complete through the security gate ·
**cutover done, `nahltech.com` live** · 426 tests passing

## 1. Status

**The build is COMPLETE through the security gate.** Live at
**https://nahltech.com** since the 17 Aug cutover; the
`nahltech-web.vercel.app` alias still resolves. HEAD `ed5235c` · 178 commits ·
**426 tests passing** · first-load JS **145 kB** on `/about`, `/contact` and
`/pricing`, **146 kB** on the five service pages and **123 kB** on
`/ai-consulting-indianapolis` and each of the four market pages, against a
145 kB ceiling — measured at this HEAD, breach and remedy in §3b.

Everything is shipped: foundation, six page templates, the design pass, five
service pages, all approved copy, published pricing, the backend (three API
routes, lead alerting, chat widget), the MDX blog and research pipelines, the
legal pages, full schema.org coverage, GA4, the performance pass, the launch
gates and the security gate — plus, on 24 Aug, the Indianapolis local landing
page, which is a seventh template and **not** a sixth service.

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
- **Organization gained `areaServed` and `knowsAbout`.** Eight `Country` nodes
  then, **ten since 3 Sep** — ISO 3166-1 alpha-2, every region named country by
  country because `areaServed` takes places and "the Gulf region" is not one.
  Five subjects in `knowsAbout`,
  each backed by a service page that sells that work. **No `slogan`** — none is
  approved and an invented tagline is a product claim.
- **LocalBusiness carries the same countries as Organization.** Its old
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
- **`AREA_SERVED` is one constant again.** All five Service nodes read it, and
  a test asserts "Worldwide" appears on no node. It held eight countries then
  and holds ten now; the point of the bullet is that there is one list, not
  what its length is on any given day.

**One scoped exception to that, approved 24 August 2026.** City nodes were
removed site-wide so the graph makes one claim. `/ai-consulting-indianapolis`
is the deliberate exception: its subject is the local footprint, and its
`areaServed` mirrors the GBP service-area list 1:1 — twenty Indiana cities,
in the Business Profile's own order. **Do not add City objects anywhere
else.** The reason it is 1:1 rather than derived from the page's prose is
cross-source corroboration: AI systems check a local business against its
Business Profile, and a service area that disagrees reads as two businesses.
The page names eight of the twenty out loud; the rest are served without
being listed in a sentence.

`AREA_SERVED` itself is untouched and still shared — Organization,
LocalBusiness and the five `serviceSchema` nodes all read it. The city list
lives beside `localServiceSchema` instead, so widening the footprint cannot
reach another node. `schema-org.test.ts` asserts `"City"` appears on that
node and on no other, and `ai-consulting-indianapolis.test.ts` pins the
twenty against an independent copy of the approved list.

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
  production deploys only, never in the build. 31 URLs in the sitemap at that
  commit; **32 now**, since the Indianapolis page joined it.

**Since that snapshot — 24 Aug, the Indianapolis landing page, three commits.**

- **`24b9e94` — `/ai-consulting-indianapolis`.** A local landing page built
  from the approved draft out of the existing blocks. **Not a sixth service:**
  `serviceRouteKeys` stays five, the nav is unchanged, and `knowsAbout` gains
  nothing. The draft's pricing table contradicted `/pricing` in four places, so
  it is not transcribed — `src/lib/pricing-mirror.ts` builds the rows from
  `t.pricing` at render time and throws if a row is renamed, and `schema-org`
  builds the `Offer`s from the same list. **The page cannot quote a price
  `/pricing` does not publish**; do not replace the mirror with literals. Four
  copy amendments are recorded in the provenance block in
  `src/lib/i18n/get-dictionary.ts` (§2). Inbound links come from the home grid,
  the services hub, `/services/ai-consultancy` and the two Indianapolis posts,
  all on the founder's anchor; `crawl:check` reports zero orphans and zero
  broken links. First-load **123 kB**, under the ceiling — this page closes on
  `CtaBlock`, not on an embedded lead form, so it is not a fourth lead surface
  (§3b).
- **`698dd2b` — the 75-day delivery promise on `/pricing`.** The landing page
  published the guarantee and the rate card did not, so two pages stated
  different terms for the same engagement. The sentence lives at
  `pricing.guarantee` and both pages read that key, so it cannot be worded one
  way on one page and another way on the other. It renders under "Builds and
  retainers" rather than with the tiers because it does not cover audits, which
  the landing page's third FAQ says out loud.
- **`01b4c66` — the service areas mirror the Business Profile.** The scoped
  `City` exception recorded above, in full: the twenty GBP cities sit on the
  local `Service` node, `AREA_SERVED` is untouched, and the eight the copy
  names are checked to be inside the twenty rather than being the source of
  them.

Whether `npm run indexnow` has been run for the new URL is **not recorded
here** — check before assuming it was.

**Since that snapshot — 3 Sep, the territory expansion, one commit.**

- **`2264250` — ten countries and one rewritten identity phrase.** GTM sells
  into the USA, Canada, the UAE, Saudi Arabia, Kazakhstan and New Zealand, so
  the sentence that names the territory changed. **It is frozen now.** The
  phrase sits in one place precisely because repeated identity churn resets
  what AI systems have converged on about this company; this was the single
  sanctioned edit, and rewording it again spends that convergence.
  - **Long form** — the `/about` lead and the `llms.txt` blockquote: "serving
    businesses across North America, the Gulf region, Central Asia, and New
    Zealand". **Short form** — the three meta surfaces: "Serving North
    America, the Gulf, Central Asia, and New Zealand."
  - **A test pins the four regions across both lengths.** The two forms word
    the Gulf differently on purpose — "the Gulf" against "the Gulf region" —
    but the regions they name may not differ, because an expansion that
    reaches one form and not the other is how a site starts telling two
    stories about where it sells.
  - **`AREA_SERVED` is ten**, KZ and NZ appended in the descriptor's own
    order: North America (US, CA), the Gulf (AE, SA, QA, KW, BH, OM), Central
    Asia (KZ), New Zealand (NZ). Still one shared constant read by
    Organization, LocalBusiness and the five Service nodes, and the
    Indianapolis twenty-city exception is untouched.
  - **Central Asia is a region in the sentence and one country in the graph.**
    The expansion named Kazakhstan and not the other four states, so listing
    them would be the machine half claiming more ground than the firm sells
    into. A test pins UZ, TM, KG and TJ as absent — widen that list on a
    decision, not because the phrase sounds broader than it is.
  - **§2 measured 177 characters, 12 over the pack's 165 guideline**, shipped
    un-trimmed on the founder's call because neither approved wording cleared
    the guard (the ampersand fallback came to 174). **Superseded the same day**
    by the 163-character rewrite below.
  - **The Indianapolis FAQ was out of scope and now disagrees.** Its "Do you
    come on-site?" answer still closes on "we serve clients across the United
    States, Canada, and the Gulf region" — in the rendered `FAQPage` markup as
    well as in the prose. **§4 item 8.**

**Then, same day — `716322d`, four market landing pages.**

Canada, the Gulf, Central Asia and New Zealand, one per territory the
descriptor names, at `/markets/<market>`. Same limits as the Indianapolis
page: **not services** — `serviceRouteKeys` stays five, the nav is unchanged,
`knowsAbout` gains nothing.

- **There is no `/markets` hub and that is deliberate.** Nothing links the
  path, `breadcrumbSchema` skips a segment it cannot resolve, and a hub would
  be a page with no approved copy on it. The four leaves are the feature.
- **`MarketTemplate` (T8), not `LocalLandingTemplate`.** That page mirrors the
  rate card into a table because its copy asked for one; these quote prices in
  prose, so there is no table and no `pricing-mirror` call. Sections render
  **paragraphs → bullets → price-anchoring line**, and that order is the copy,
  not a layout preference: each "For context:" sentence was written to land
  right after the block quoting the figures.
- **Prose prices are asserted, not mirrored.** `markets.test.ts` reads every
  dollar figure back out of all four pages and fails on any the rate card does
  not publish. Same invariant as the mirror, approached from the other end,
  because interpolating a value into an approved sentence would be rewriting
  it. No draft figure conflicted: $2,500 credited within 90 days, builds from
  $6,000, the 75-day promise.
- **Service + FAQPage + BreadcrumbList per page.** `Country` objects only —
  CA · AE, SA, QA, KW, BH, OM · KZ · NZ — and a test asserts each set is a
  **subset of the Organization's ten**, so a market page can narrow the graph's
  territory and never widen it. **No City anywhere**; the Indianapolis
  exception stays sole. No `offers` either: the other two Service builders read
  a published figure, and parsing one back out of a sentence would be
  synthesising markup from prose.
- **One sentence links all four, and it is literally one sentence.** The
  founder supplied it for the Indianapolis page; the home page and the /about
  services band render the same key. **No lead-in prose was authored for
  either placement** — only the commas and the "and" are code, pinned by a data
  test and a DOM test. `ServicesGrid` gained a `footer` slot to carry it.
- Four founder amendments, all in the provenance block: the Canada meta ships
  at **163** after the draft's 167 broke its own ≤165 guard; the **damaged
  Central Asia lead** was supplied whole rather than reconstructed, which is
  what added the heading "What we do for Central Asian businesses"; the four
  price-anchoring sentences are new approved copy; the markets sentence is
  re-used rather than rewritten.
- `crawl:check` **PASS at 36 pages** — zero orphans, zero broken links. The
  four URLs are in the sitemap because the route registry builds it.

**Then, same day — the phrase harmonisation, one commit.**

Both open territory items closed together, on one founder decision: **the
frozen phrase wins everywhere.**

- **§2 is 163 characters** and clears the 165 guideline for the first time
  since August. The founder restructured the sentence rather than shortening
  the territory list — firm and territory in one clause, the three
  capabilities as a fragment — so **the frozen phrase itself is unchanged**.
- **All three surfaces carry it, not the two the instruction named.**
  `site.description` is the same string by construction and is what the
  Organization node reads; leaving it behind would have split the identity
  between the graph and the pages, which is the exact failure the one-string
  rule prevents, and `copy-provenance.test.ts` would have failed.
- **The two stale territory sentences are corrected** — the Indianapolis "Do
  you come on-site?" answer and the Canada page's first FAQ answer. Both
  render from one dictionary key each, so **prose and `FAQPage` markup moved
  together**; verified in the rendered output rather than assumed.
- **`llms.txt` moved with them.** It quotes each key page's own first
  metadata sentence, so the home and About lines went stale the moment the
  descriptor changed. `llms-txt.test.ts` caught it — which is that file's
  whole reason for existing, and worth knowing before hand-editing it.
- **Two tests now hold the harmonisation.** Any string naming two of the four
  regions together must name all four — a list of the footprint has to be the
  whole footprint — and the three superseded phrasings must appear nowhere.
  The second is the one that catches an edit reaching for an old sentence out
  of a draft or from memory.

**Then, 4 Sep — the Canada funding guide, three commits.**

- **`dc0a2b9` — `/blog/ai-funding-canada-small-business`.** A decision-cluster
  post for the Canadian market, supplied approved and inserted verbatim.
  Frontmatter was the only part written here: `author`, `cluster`,
  `targetKeyword`, `serviceLinks` and `draft` filled to match the sibling
  decision posts, plus `updatedAt`. Title, description and date keep their
  supplied values; the description measures **165 against its own 165 guard**,
  with nothing to spare — a word added to it fails the check.
  - **The build gate rejected it first, and that was correct.** The post
    arrived with no `/blog/` links, and `blog.ts` requires two sibling links
    once a cluster has three or more published posts. The body is founder
    copy, so nothing was invented and nothing was reworded: the gate was
    reported and the founder supplied two sentences. **This is the shape to
    repeat** — a rejected post is a question for the founder, not a licence to
    edit copy or weaken a gate.
  - **No H1 was added.** No post in this collection carries one; every title
    renders from frontmatter. The body starts on its italic dateline.
  - **FAQPage needed no wiring.** The post route already builds it from a
    "Frequently asked questions" section, and the five `###` questions parse
    into it as written.
  - **`/markets/canada` gained the link its copy was waiting for.** The
    funding bullet shipped with a placeholder; it now closes on the founder's
    anchor, "Canada AI funding guide". Anchor text sits in the dictionary
    beside the sentence, the destination comes from the route registry, and a
    test asserts the slug still resolves to a published post — the same
    arrangement the home page's dataset link has, because a blog post is a
    file rather than a route and hard rule 7 has nothing of its own to check.
- **`f905b16` — `updatedAt` reaches the sitemap.** §4 item 5, closed. The
  field is **optional and absent on every post that has never been revised**;
  the sitemap emits `updatedAt ?? date`, so no existing post's `lastmod`
  moved. Defaulting it to `date` was rejected on purpose: it would make
  "published and untouched" indistinguishable from "revised on publication
  day", which is the one distinction the field exists to draw.
- **`343e21d` — the Article node agrees with the sitemap.** For a week the
  sitemap said a post had changed while its `Article` markup still carried
  only `datePublished`. Both now read `updatedAt`, `dateModified` is omitted
  where there is none, and a test walks every published post checking the two
  surfaces against the same value. **They are one field; keep them that way.**

**Then, same day — `ed5235c`, the Gulf website study.**

A second data report: 44 completed audits of Gulf SMB websites, supplied
approved and inserted verbatim. Frontmatter was the only part written here.

- **The flagship pin is the part to read.** See §2 — a second `data-report`
  took the home page's research slot simply by being newer, and publishing
  must not re-point that slot. Pinned to `datasetReportSlug`, asserted by a
  test.
- **`updatedAt` reached research too**, mirroring the blog: optional, absent
  where nothing was revised, read by both the sitemap's `lastmod` and the
  `Article` node's `dateModified`. **The study carries none** — it published
  the same day, and `dateModified` equal to `datePublished` is the false
  signal the field exists to prevent. Set it at the first real revision.
- **A `Dataset` entry was required, not optional.** A test asserts every
  `data-report` carries one. Values are read off the study's own prose, and
  `temporalCoverage` is the **month** (`2026-09`) rather than a day range,
  because "early September 2026" is what the document says — a start and end
  date would be a claim it does not make.
- **The meta description was amended by the founder before merge.** It read
  "We audited 54 SMB websites" and then quoted 55%, computed over the 44
  audits that completed — two denominators in the one sentence Google shows,
  on a document whose whole claim is that its numbers are checkable. It says
  44 throughout now, at 164 characters. **The body was never touched**: it
  states 54 attempted and 44 completed, and always did.
- Inbound links: `/markets/gulf` closes its execution-gap section with the
  study, and the 187-site report points forward to it from its own closing
  paragraph. `crawl:check` 38 pages, zero orphans, zero broken links.

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

**Blog — 11 files, 9 published.** Pipeline: `content/blog/*.mdx` →
`src/lib/blog.ts` (zod frontmatter plus build-time gates) →
`next-mdx-remote/rsc`. Rules live in `docs/blog-content-conventions.md`.

| Cluster | Count | Notes |
| --- | --- | --- |
| `decision` | 6 published | the SEO cluster, plus the Canada funding guide |
| `field-notes` | 3 published | migrated, revised |
| `brand` | 2 **`draft: true`** | withdrawn 13 Aug; both slugs 308 to `/about` |

**One post is maintained, not published-and-left:**
`ai-funding-canada-small-business` states a month in its title, its meta
description and its opening dateline, and its claims are checked against
government pages. It is the only post with `updatedAt`, and the only one whose
`lastmod` and `dateModified` move. The refresh procedure is in §5.

The two brand posts are withdrawn, not deleted — the files stay, and
`next.config.ts` redirects both old URLs so nobody holding a link hits a 404.
Reversible in one edit.

**Research — 6 artifacts, all live.** `content/research/*.mdx` →
`src/lib/research.ts`. Exempt from the blog's sibling-link and offer-link gates
(they cross-reference each other by hand already); link *resolution* is not
relaxed. Hub order is by kind, then **the pinned flagship**, then date:

1. `crawlmouse-dataset-report` — **the flagship, featured on the home page,
   and pinned there in code.** Original data from 187 sites; carries `Dataset`
   schema, licensed CC BY 4.0 in the markup and in the closing paragraph of
   the report itself
2. `gulf-smb-websites-ai-search-study` — 44 completed Gulf SMB audits, the
   second data report. Newer than the flagship and deliberately behind it
3. `how-we-measure` — the methodology, the spine every engagement points at
4–6. the three sample engagements — Kestrel, Redbud, Limestone. All three
   carry the fictional-client disclosure banner above the h1, before any number

**The flagship is pinned, and this is the entry that says why.**
`getResearchForHub` sorts `datasetReportSlug` first, ahead of the kind
order. Without it the hub is kind-then-newest, and the home page takes the
hub's first entry — so the moment a second `data-report` shipped, it took
the home page's research slot by being newer. **Publishing must not re-point
that slot.** The pin reads the same constant the home page and `llms.txt`
already use, so the flagship is one decision in one place; changing which
document leads is a one-line edit to that constant, made on purpose.
`research.test.ts` asserts the newer study sits behind the older one and
fails if recency wins again — that test is the decision, not a nuisance.

**Every `kind: "data-report"` needs a `DATASETS` entry** in `schema-org.ts`,
and a test enforces it. A data report with no `Dataset` node publishes original
data while telling search engines it published none.

**`/about` carries its final approved copy**, reordered 22 Aug: the canonical
descriptor, the "What we actually do" service band, then "Our story", "What we
do", "What we've built", the italic sign-off, and "The founders" with both
photographs. The story is demoted, not edited.

**Both meta descriptions are COPY-PACK-1 §2 as of 22 Aug**, character-identical
to `site.description` and to the Organization node's `description` — one string
on three surfaces, pinned by `copy-provenance.test.ts` so editing one and not
the others fails rather than drifts. Its third sentence has been rewritten
three times and the pattern is the point: 171 characters as supplied, 158 after
the founder's 22 Aug amendment (`83643d1`), 177 with the 3 Sep territory
expansion (`2264250`), and **163 now**, after the founder restructured it later
the same day. Each time the copy was flagged rather than trimmed, because
cutting approved copy to fit a guideline is rewriting it (hard rule 12), and
each time the founder chose what shipped. The current form leads with the firm
and the territory in one clause and lists the three capabilities as a fragment
— it is the first version since August to clear the 165 guideline. The About
prefix the pack offered was resolved by the pack's own rule: prefixed it comes
to 188, so §2 ships unmodified. Both `metaTitle`s are untouched, at 65 and 84
characters.

**`/ai-consulting-indianapolis` carries approved copy with four recorded
amendments** (24 Aug). Its pricing table is not copy at all — it is read from
`t.pricing` through `src/lib/pricing-mirror.ts`, because the draft's figures
contradicted the rate card in four places. Two prose sentences carry
founder-supplied replacements for the figures that conflicted;
`audience.closing` dropped one word to clear the rule-15 banned list; and the
meta description ships at 163 against the draft's own 165 guard. All four are
written into the provenance block in `src/lib/i18n/get-dictionary.ts`, not left
in a commit message.

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
5. ~~**Blog `updatedAt` → sitemap `lastmod`.**~~ — **done 4 Sep 2026**
   (`f905b16`, `343e21d`). Optional in the frontmatter schema, absent on every
   post never revised, and read by both the sitemap's `lastmod` and the
   `Article` node's `dateModified`. The two posts `c189020` edited still carry
   no `updatedAt`: setting one now would claim a revision date this repo
   cannot evidence, and the recrawl that mattered has long since happened.
   Set it on the next real edit to either.
6. ~~**Decide where the GitHub profile is claimed.**~~ — **done 22 Aug 2026.**
   `83643d1` took the footer route: the account joined `socialLinks`, so it
   reaches `sameAs` through `companyProfiles` and the markup claims only a
   profile the site links. The founder's **Person** node and the LinkedIn-only
   host guard in `lib/authors.ts` were deliberately not touched, and that is
   still the line — a personal LinkedIn stays off the company node.
7. ~~**Align `AREA_SERVED` on the Service nodes.**~~ — **done 22 Aug 2026.**
   `83643d1` made it one constant: all five Service nodes read one list, and a
   test asserts "Worldwide" appears on no node. The single
   deliberate exception is the twenty Business Profile cities on the local
   `Service` node (§1) — do not add `City` objects anywhere else.
8. ~~**Amend the two stale territory sentences.**~~ — **done 3 Sep 2026.**
   The Indianapolis "Do you come on-site?" answer and the Canada page's first
   FAQ answer each named a territory the descriptor had moved past, in
   `FAQPage` markup as well as in prose. The founder settled both in one
   decision — the frozen phrase wins everywhere — and two tests now hold it:
   a footprint list must name all four regions, and the superseded phrasings
   must appear nowhere. **The site states its territory one way.**

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

- **The territory phrase off-site, after the `2264250` deploy.** One edit each,
  the same sentence, and worth doing close together: an assistant checking this
  company against its own profiles should not find one of them still describing
  the old footprint.
  - **Google Business Profile** → Edit profile → Description: "…serving
    businesses across North America, the Gulf region, Central Asia, and New
    Zealand…"
  - **LinkedIn** company About: the same single-phrase edit.
  - **Search Console**: request indexing on `/` and `/about`, then run
    `npm run indexnow`.

- **The four market URLs, after the `716322d` deploy.** Request indexing in
  Search Console on `/markets/canada`, `/markets/gulf`,
  `/markets/central-asia` and `/markets/new-zealand`; submit the same four in
  **Bing Webmaster Tools**; run `npm run indexnow`. One ping covers the
  sitemap, which is **37 URLs** now.

- **The Canada funding guide, after the `dc0a2b9` deploy.** Request indexing
  on `/blog/ai-funding-canada-small-business` and on `/markets/canada`, which
  changed in the same commit; submit the post in Bing; run `npm run indexnow`.

- **The Gulf study, after the `ed5235c` deploy.** Request indexing on
  `/research/gulf-smb-websites-ai-search-study` and `/markets/gulf`; the
  187-site report changed in the same commit and is worth re-requesting too.
  Submit the study in **Bing**; run `npm run indexnow`. The sitemap is **38
  URLs** now. Then the SEO chat gets "study live" for the Gulf media pitch
  list, and the social chat gets the stat sheet.

- **RECURRING — refresh the Canada funding guide, 1st of each month (~5 min).**
  It is the only maintained post on the site, and its whole credibility rests
  on the date being true rather than decorative.
  1. Update the month in **three places**: the `title`, the `description`, and
     the "Last checked" dateline in the body. All three say it out loud, and a
     guide claiming September in the title while the body says August is worse
     than one carrying no date at all.
  2. **Re-verify the four claims at source** — CDAP's status on
     `ised-isde.canada.ca`, LIFT's terms on `bdc.ca`, the IRAP page and phone
     number on `nrc.canada.ca`, and the Compute Fund intake on ISED. The post
     tells the reader every claim is dated and checkable; that promise is the
     product.
  3. **Bump `updatedAt`.** It drives both the sitemap's `lastmod` and the
     `Article` node's `dateModified`, which is what asks for the recrawl.
     Leaving it stale makes the refresh invisible to the crawlers it was for.
  4. Ship it through **the same ask-before-merge flow** the post itself went
     through: gates green, commit, present, wait for the founder's yes. Body
     copy stays founder copy on a refresh exactly as it was on publication.
  5. Afterwards: request indexing on the post, then `npm run indexnow`.

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
