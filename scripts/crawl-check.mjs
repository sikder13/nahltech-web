/**
 * Internal-link sanity check. Part of the pre-launch checklist.
 *
 *   npm run crawl:check                     # against http://127.0.0.1:3000
 *   npm run crawl:check -- https://…        # against a deployment
 *
 * Crawls the site from `/` following internal links only, and reports what
 * actually breaks an internal-link audit:
 *
 *   ORPHANS   pages in the sitemap that nothing links to. A page reachable
 *             only by typing its URL is a page search engines discover late
 *             and visitors never discover at all.
 *   DEPTH     clicks from the home page. Past three, a page is effectively
 *             buried — ARCH-1 §5's page graph is built to keep everything
 *             within three.
 *   BROKEN    any internal link that does not resolve. Hard rule 7, checked
 *             against the rendered site rather than the route registry.
 *   DUPLICATE two editorial links sending the same anchor text at the same
 *             ANCHORS article. This is the finding a Crawlmouse audit reports
 *             as anchor concentration, and it regresses easily: the phrase
 *             that felt natural when writing post four is the phrase that
 *             felt natural when writing post two.
 *
 * What is deliberately *not* failed, with the reasoning at each definition:
 * site chrome (`stripChrome`), card and list headings that carry an item's
 * title (`anchorsIn`), and repeated calls to action pointing at conversion
 * pages (`isArticle`). All three are counted and printed.
 *
 * Exits non-zero on any failure, so it can gate a release.
 */
const BASE = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const MAX_DEPTH = 3;

const origin = new URL(BASE).origin;

/** Strip the fragment and any trailing slash so `/a`, `/a/` and `/a#b` are one page. */
function toPath(href) {
  const url = new URL(href, BASE);
  const path = url.pathname.replace(/\/+$/, "");
  return path === "" ? "/" : path;
}

/** Same, but null for anything that leaves this origin — used when crawling. */
function normalise(href) {
  const url = new URL(href, BASE);
  return url.origin === origin ? toPath(href) : null;
}

/**
 * Sitemap entries are always absolute on the canonical production origin
 * (`https://nahltech.com`), so they are compared by path. Running the origin
 * filter over them would discard every one when crawling localhost or a
 * preview deployment — which reads as "sitemap entries 0" and quietly passes.
 */
function sitemapPath(href) {
  return toPath(href);
}

async function fetchPage(path) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  const body = res.status < 300 ? await res.text() : "";
  return { status: res.status, location: res.headers.get("location"), body };
}

/** Anchors only. Excludes the nofollow-irrelevant stuff we do not crawl. */
function linksIn(html) {
  const out = new Set();
  for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
    const href = m[1];
    if (href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    const path = normalise(href);
    if (path) out.add(path);
  }
  return [...out];
}

/**
 * Site chrome: header, footer and any nav landmark.
 *
 * Removed before anchor analysis. Every page carries the same header and
 * footer, so counting them would report "Services" linked identically from
 * thirty pages — which is navigation working correctly, not anchor
 * concentration. Leaving them in produced exactly that: a check that failed
 * on its first run for a reason that was not a finding.
 */
function stripChrome(html) {
  return html
    .replace(/<header\b[\s\S]*?<\/header>/gi, "")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, "")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, "");
}

/**
 * Every link with its anchor text, split into two classes.
 *
 * **prose** — a link written inside a sentence. Its anchor text is an
 * editorial choice, so two of them pointing at the same page with identical
 * wording is a real finding: it concentrates the signal and, more to the
 * point, it usually means one of the two sentences was written on autopilot.
 *
 * **card** — a link that *is* a card or list heading. Its anchor text is the
 * target's title, because that is what the heading has to say: a card whose
 * link text is not the item's title is worse to use and worse to hear read
 * aloud. These necessarily repeat — one hub card plus a related-rail entry on
 * every sibling page — so they are counted and reported but do not fail the
 * run. Changing that is a design decision, not a lint fix.
 */
function anchorsIn(rawHtml) {
  const html = stripChrome(rawHtml);
  const out = [];
  for (const m of html.matchAll(
    /<a\b[^>]*\shref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g,
  )) {
    const href = m[1];
    if (href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    // A fragment-only href is in-page navigation, not an inbound link. The
    // skip link is the obvious case: `#main` normalises to `/`, which made
    // "Skip to content" look like thirty identical links to the home page.
    if (href.startsWith("#")) continue;
    const target = normalise(href);
    if (!target) continue;

    const text = m[2]
      .replace(/<[^>]*>/g, "")
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;

    // A card/list heading wraps its link directly: `<h2 …><a …>`.
    const before = html.slice(Math.max(0, m.index - 200), m.index);
    const kind = /<h[1-6][^>]*>\s*$/.test(before) ? "card" : "prose";
    out.push({ target, text, kind });
  }
  return out;
}

console.log(`crawling ${BASE}\n`);

// Sitemap is the authority on what should exist.
const sitemapXml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const sitemapPaths = new Set(
  [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    sitemapPath(m[1]),
  ),
);

if (sitemapPaths.size === 0) {
  console.error("Sitemap parsed to zero entries — refusing to pass vacuously.");
  process.exit(1);
}

const depth = new Map([["/", 0]]);
const inboundFrom = new Map();
const anchorsTo = new Map();
const broken = [];
const queue = ["/"];
const seen = new Set(["/"]);

while (queue.length) {
  const path = queue.shift();
  const { status, location, body } = await fetchPage(path);

  if (status >= 400) {
    broken.push({ path, status });
    continue;
  }
  if (status >= 300) {
    // A redirect is a valid destination, not a page to crawl through.
    if (location) console.log(`  ${path} -> ${status} -> ${location}`);
    continue;
  }

  for (const anchor of anchorsIn(body)) {
    if (!anchorsTo.has(anchor.target)) anchorsTo.set(anchor.target, []);
    anchorsTo.get(anchor.target).push({ ...anchor, from: path });
  }

  for (const target of linksIn(body)) {
    if (!inboundFrom.has(target)) inboundFrom.set(target, new Set());
    inboundFrom.get(target).add(path);

    const next = depth.get(path) + 1;
    if (!depth.has(target) || next < depth.get(target)) depth.set(target, next);
    if (!seen.has(target)) {
      seen.add(target);
      queue.push(target);
    }
  }
}

const orphans = [...sitemapPaths].filter(
  (path) => path !== "/" && !(inboundFrom.get(path)?.size > 0),
);
const tooDeep = [...sitemapPaths]
  .map((path) => ({ path, d: depth.get(path) }))
  .filter(({ d }) => d === undefined || d > MAX_DEPTH);

console.log(`\npages crawled      ${seen.size}`);
console.log(`sitemap entries    ${sitemapPaths.size}`);

const byDepth = new Map();
for (const path of sitemapPaths) {
  const d = depth.get(path);
  byDepth.set(d, (byDepth.get(d) ?? 0) + 1);
}
console.log(
  `depth histogram    ` +
    [...byDepth.entries()]
      .sort((a, b) => (a[0] ?? 99) - (b[0] ?? 99))
      .map(([d, n]) => `${d ?? "unreached"}:${n}`)
      .join("  "),
);

let failed = false;

console.log(`\nORPHANS            ${orphans.length}`);
for (const path of orphans) console.log(`  ${path}`);
if (orphans.length) failed = true;

console.log(`DEPTH > ${MAX_DEPTH}          ${tooDeep.length}`);
for (const { path, d } of tooDeep)
  console.log(`  ${path} (${d ?? "unreached"})`);
if (tooDeep.length) failed = true;

console.log(`BROKEN LINKS       ${broken.length}`);
for (const { path, status } of broken) console.log(`  ${path} -> ${status}`);
if (broken.length) failed = true;

/**
 * Anchor-text diversity.
 *
 * Two editorial links to the same page with the same wording is the finding
 * an internal-link audit reports as anchor concentration — and the fix is
 * always to rewrite one of them, never to delete a link. Failing here means a
 * future post cannot quietly reintroduce it.
 */
/**
 * Only article targets are gated.
 *
 * Anchor diversity is an editorial signal about *content* — two posts sending
 * the same phrase at the same article is the concentration an audit reports.
 * A conversion target is different: "book the free scan" pointing at /contact
 * from three sibling documents is one call to action written once and used
 * consistently, and varying it for a linter would make the writing worse. So
 * those are counted and shown, and left to a human.
 */
const isArticle = (t) => t.startsWith("/blog/") || t.startsWith("/research/");

const proseDupes = [];
const ctaDupes = [];
const cardDupes = [];
for (const [target, anchors] of [...anchorsTo].sort()) {
  for (const kind of ["prose", "card"]) {
    const counts = new Map();
    for (const a of anchors.filter((a) => a.kind === kind)) {
      if (!counts.has(a.text)) counts.set(a.text, []);
      counts.get(a.text).push(a.from);
    }
    for (const [text, froms] of counts) {
      if (froms.length < 2) continue;
      const bucket =
        kind === "card" ? cardDupes : isArticle(target) ? proseDupes : ctaDupes;
      bucket.push({ target, text, froms });
    }
  }
}

console.log(`DUPLICATE ANCHORS  ${proseDupes.length}`);
for (const { target, text, froms } of proseDupes) {
  console.log(`  ${target}`);
  console.log(`    ${froms.length}x "${text}"`);
  for (const f of froms) console.log(`        from ${f}`);
}
if (proseDupes.length) failed = true;

// Reported, not enforced — see anchorsIn() and isArticle().
console.log(
  `  (card/list headings reusing a title: ${cardDupes.length} group(s) — expected, see anchorsIn)`,
);
console.log(
  `  (repeated calls to action on non-article targets: ${ctaDupes.length} group(s))`,
);
for (const { target, text, froms } of ctaDupes) {
  console.log(`      ${froms.length}x "${text}" -> ${target}`);
}

console.log(`\n${failed ? "FAIL" : "PASS"}`);
process.exit(failed ? 1 : 0);
