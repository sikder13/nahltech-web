/**
 * Internal-link sanity check. Part of the pre-launch checklist.
 *
 *   npm run crawl:check                     # against http://127.0.0.1:3000
 *   npm run crawl:check -- https://…        # against a deployment
 *
 * Crawls the site from `/` following internal links only, and reports the two
 * things that actually break an internal-link audit:
 *
 *   ORPHANS  pages in the sitemap that nothing links to. A page reachable only
 *            by typing its URL is a page search engines discover late and
 *            visitors never discover at all.
 *   DEPTH    clicks from the home page. Past three, a page is effectively
 *            buried — ARCH-1 §5's page graph is built to keep everything
 *            within three.
 *
 * It also fails on any internal link that does not resolve, which is hard rule
 * 7 checked against the rendered site rather than against the route registry.
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

console.log(`\n${failed ? "FAIL" : "PASS"}`);
process.exit(failed ? 1 : 0);
