# CUTOVER — pointing nahltech.com at the new site

This is the step-by-step for moving the live domain onto the new site. It is
written to be executed alone, in one sitting, without needing anything else
open. Read the whole thing once before starting.

**Everything below was verified against live DNS on 13 August 2026.** If you
run this much later, re-check §1 first — the starting state may have moved.

**Expected total time:** about 45 minutes, most of it waiting for DNS.

---

## 0. The one thing that will surprise you

`nahltech.com` is **already on Vercel** — but on a different Vercel project
than the new site. Loading https://nahltech.com today returns a page titled
"Nahl Technologies — AI for Society" served with a `server: Vercel` header.

That matters because **Vercel will not let two projects claim the same
domain.** If you go to the `nahltech-web` project and try to add
`nahltech.com`, it will refuse until the domain is released from wherever it
currently lives.

The old project is **not** in the `Nahl Technologies' projects` team — that
team only contains `nahltech-web` and `crawlmouse-001`, and neither has a
custom domain attached. So the old project is almost certainly on your
**personal Vercel account**. Log in and look there first.

**Do step 2 before you touch DNS.** If you change DNS first, the site goes
down while you hunt for the old project.

---

## 1. Where things stand right now

Registrar / DNS panel: **Northwest Registered Agent**.
Nameservers: `ns1.hosting.businessidentity.llc`, `ns2.hosting.businessidentity.llc`

| Record | Name | Value | What it is |
| --- | --- | --- | --- |
| A | `@` | `216.198.79.1` | Vercel — serves the **old** site |
| A | `www` | `66.223.49.89` | Northwest hosting — **broken over HTTPS today** |
| A | `*` | `66.223.49.89` | Wildcard, Northwest hosting |

Two things worth knowing about that table:

- **`www` is currently broken.** `https://www.nahltech.com` fails to connect
  at all — there is no valid certificate on it. Anyone typing the `www` form
  today gets an error page. Fixing this is part of the win here, not a risk.
- **There is a wildcard `*` record.** It catches every subdomain you have not
  explicitly defined and sends it to Northwest hosting. Leave it alone during
  cutover; just know it exists, because it explains why a typo'd subdomain
  resolves to something rather than nothing.

### Records that must NOT be touched

Your email and your transactional mail both run off this zone. **Do not
delete, edit, or "clean up" any of these.** Changing one of them will silently
stop mail from arriving or start sending your lead alerts to spam.

| Record | Name | Value |
| --- | --- | --- |
| MX | `@` | `0 nahltech-com.mail.protection.outlook.com` |
| TXT | `@` | `v=spf1 include:spf.protection.outlook.com -all` |
| TXT | `@` | `MS=ms19451516` |
| TXT | `@` | `google-site-verification=ouR3GRk2pt5tw_1tLCrRPCYW-CGmsInSQvaEdzQ5GgA` |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| MX | `send` | (Resend / Amazon SES) |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEB…` (DKIM signing key) |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:bounce@dmarc.businessidentity.llc; …` |
| CNAME | `autodiscover` | `autodiscover.outlook.com` |

The only records you are changing are the **A record on `@`** and the
**A record on `www`**. Nothing else.

The Google verification TXT is what keeps Search Console working. It stays,
and because it stays, you do not need to re-verify the site after cutover.

---

## 2. Release the domain from the old project — do this first

1. Go to https://vercel.com and sign in.
2. Use the account switcher (top left) to check **each account you have**,
   including your personal one, not just `Nahl Technologies' projects`.
3. Find the project that currently holds `nahltech.com`. It is the one serving
   the "AI for Society" page.
4. Open that project → **Settings** → **Domains**.
5. Remove **`nahltech.com`** and **`www.nahltech.com`** if present.

> **The old site goes down at this moment.** That is expected and it is brief.
> Have step 3 ready to go before you do this.

If you cannot find the old project, stop and do not proceed. Changing DNS
while the domain is still claimed elsewhere will produce a certificate error
rather than a working site.

---

## 3. Claim the domain on the new project

1. Still on Vercel, switch to the **Nahl Technologies' projects** team.
2. Open the **nahltech-web** project → **Settings** → **Domains**.
3. Add `nahltech.com`.
4. Add `www.nahltech.com`.
   - When Vercel asks how to handle the pair, choose **`www` redirects to
     `nahltech.com`** (the apex is the canonical form — the whole site,
     sitemap and structured data all use `https://nahltech.com`).
5. Vercel will now show you **the exact DNS records it wants**, next to a
   red or yellow "Invalid Configuration" notice. **Write those values down.**

> **Read the values off that screen — do not use values from memory, from
> this document, or from a blog post.** Vercel has changed its recommended
> anycast IP before: their own docs still show `76.76.21.21`, while your
> current live apex sits on `216.198.79.1`. The dashboard is the only
> authority for what to enter today.
>
> Typically it asks for an **A record on `@`** and a **CNAME on `www`**
> pointing at something like `cname.vercel-dns.com`. Take what it gives you.

There is a real chance the `@` A record it asks for is **the same
`216.198.79.1` already in your panel**. If so, leave `@` alone — the apex
needs no DNS change at all, and steps 2–3 were the entire apex cutover.

---

## 4. Change DNS at Northwest

1. Log in to the Northwest Registered Agent panel and open DNS management
   for `nahltech.com`.
2. **`@` record:** compare Vercel's value to what is there (`216.198.79.1`).
   - Same? Change nothing.
   - Different? Edit the existing A record to Vercel's value. Do not add a
     second A record — two apex A records will load-balance between the new
     site and the old host, and roughly half your visitors will get the wrong
     one.
3. **`www` record:** the existing `A → 66.223.49.89` must go.
   - If Vercel asked for a CNAME: **delete** the `www` A record, then add
     `CNAME  www  →  <the value Vercel gave you>`.
   - If Vercel asked for an A record: edit the existing `www` A record to
     Vercel's IP.
   - A name cannot have both a CNAME and an A record. Delete before adding.
4. **Leave the wildcard `*` record alone.**
5. Set TTL to the lowest the panel allows (300 seconds / 5 minutes) if it lets
   you. This makes a rollback take minutes instead of hours.
6. Save.

---

## 5. Wait, then check

DNS takes 5–30 minutes to propagate, occasionally longer. Check with these
commands in a terminal (or use https://dnschecker.org if you'd rather not):

```bash
dig +short nahltech.com A
dig +short www.nahltech.com

# Should report 200, and the title of the NEW site:
curl -sI https://nahltech.com/ | head -1
curl -s https://nahltech.com/ | grep -o '<title>[^<]*</title>'

# www should redirect to the apex:
curl -sI https://www.nahltech.com/ | grep -i -E 'HTTP/|location'
```

You are looking for:

- `nahltech.com` → **200**, and the title reads
  **"Nahl Technologies — AI Consulting & Implementation | Indianapolis, Serving Worldwide"**.
  If you still see "AI for Society", DNS has not moved yet — wait longer.
- `www.nahltech.com` → **307 or 308**, redirecting to `https://nahltech.com/`.
- Both padlocks valid in a browser. Vercel issues the certificate
  automatically once DNS resolves; this can take a few extra minutes after the
  records go live. A certificate warning in the first ten minutes is normal.
  A certificate warning after an hour is not — see rollback.

Then click through by hand: home, pricing, one service page, one blog post,
and submit the contact form once with your own details to confirm the alert
email arrives.

---

## 6. After it is live

1. **Google Search Console** — https://search.google.com/search-console
   The site is already verified (that TXT record stayed put), so you only need
   to submit the sitemap: **Sitemaps** → enter `sitemap.xml` → Submit.
2. **Bing Webmaster Tools** — https://www.bing.com/webmasters
   Add the site if it is not there, then submit `https://nahltech.com/sitemap.xml`.
   Bing lets you import directly from Search Console, which is the fast path.
3. **Watch Search Console's Pages report for the next two weeks.** Any old URL
   that starts reporting a 404 gets a redirect added the same day — that
   report is how we find the ones we did not know about. The redirect map
   currently covers seven known legacy paths; it is not claimed to be
   exhaustive, because no export of the old site's URLs exists.
4. **Confirm mail still works.** Send yourself an email at your
   `@nahltech.com` address and confirm the contact form's alert arrived in
   step 5. If both work, the mail records survived the change.
5. Remove the old Vercel project once you are happy, so it cannot
   accidentally reclaim the domain later.

---

## 7. Rollback

If the new site is broken and you need the old one back immediately:

1. In the Northwest DNS panel, set the records back:
   - `A  @  →  216.198.79.1`
   - `A  www  →  66.223.49.89`
2. Re-add `nahltech.com` to the old Vercel project (Settings → Domains).
3. Wait 5–30 minutes.

That returns you exactly to the state described in §1.

Worth being clear-eyed about the trade: rolling back restores a site whose
`www` has been broken over HTTPS for some time. Unless the new site is
seriously wrong, fixing forward is usually the better call — the most common
cutover problem is simply waiting less time than DNS needed.

---

## 8. What is already verified, so you do not need to re-check it

Confirmed against a production build before this document was written:

- All 28 routes in the sitemap return 200, including all 10 blog posts and the
  5 migrated legacy posts.
- `/ar`, `/bn`, `/locations` and `/government` return 404, as intended.
- All 7 redirects resolve and land on a 200 page.
- Zero `[PLACEHOLDER]` strings render on any page.
- `robots.txt`, `sitemap.xml` and `blog/feed.xml` are all correct, and every
  URL in them is absolute on `https://nahltech.com`.
- Structured data is present and parses on every template.
- Lighthouse on mobile: Accessibility 100, SEO 100, Performance 97–98.
