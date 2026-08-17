# SECURITY — posture, and why it is shaped this way

This is the security design of nahltech.com. It is written to be read by two
audiences: whoever maintains the site, and a prospective client who asks "is it
secure?" and deserves specifics rather than a reassurance.

Last reviewed: 16 August 2026, at the CC-SEC-1 launch gate.

---

## Threat model, in one paragraph

This is a public marketing site with three unauthenticated write endpoints
(`/api/lead`, `/api/subscribe`, `/api/chat`) and no user accounts, no sessions,
no payments and no customer data beyond the enquiries people voluntarily send
us. There is nothing to log into, so the realistic threats are not account
takeover — they are: someone draining the Anthropic budget through the chat
endpoint, someone flooding the lead table or the founder's inbox with junk,
someone extracting a service key from a client bundle or the git history and
reading the leads table directly, and someone using an enquiry field to inject
content into the alert email a human then acts on. The design targets exactly
those, and accepts that a determined attacker with no authentication surface to
attack is mostly limited to being noisy.

---

## Database: deny-all by default

Supabase's advisor reports five `rls_enabled_no_policy` **INFO** items, on
`leads`, `lead_events`, `audit_requests`, `newsletter_subscribers` and
`notification_log`. **These are intentional and must not be "fixed".**

RLS is enabled on every table. Those five have **zero policies**, and with RLS
on and no policy, Postgres denies every operation to every non-superuser role —
so `anon` and `authenticated` can read and write nothing. All legitimate access
happens server-side through the service role, which bypasses RLS by design.

Adding a policy to clear the lint would be a downgrade, and specifically:

> RLS cannot restrict columns. Any `anon SELECT` policy on `leads` exposes
> **every column of every lead** to anyone holding the anon key — which ships
> in the browser bundle by design. There is no "read only the safe columns"
> version of that policy.

The advisor grades it INFO rather than WARN precisely because "no policy at
all" is sometimes the correct answer. It is here.

The two tables that *do* carry policies are `chat_conversations` and
`chat_messages`, which grant `anon` **INSERT only** — the chat widget logs
transcripts straight from the browser. Since `anon` has no SELECT anywhere,
`INSERT … RETURNING` is unavailable to it, which is why the chat client
generates its own UUIDs rather than reading them back.

**Migrations.** Schema changes only ever land as numbered files in
`supabase/migrations/`, applied with `psql` against `SUPABASE_DB_URL`. The
files are the source of truth; the dashboard SQL editor is for verification
only. `0003_security_hardening.sql` pinned `search_path` on
`public.touch_updated_at()`, clearing the advisor's one WARN.

---

## Keys and secrets

| Key | Where it may appear | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Public by design; safe **only because** of the deny-all posture above |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | browser + server | Public by design |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Bypasses RLS. Never prefix with `NEXT_PUBLIC_` |
| `SUPABASE_DB_URL` | local only | Direct Postgres access for migrations |
| `ANTHROPIC_API_KEY` | **server only** | Metered spend |
| `RESEND_API_KEY` | **server only** | Send-restricted |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | **server only** | Rate-limit backend |

Rules that keep that true:

- Any module importing `lib/supabase/server.ts` starts with `import "server-only"`,
  so importing it from a client component is a build error rather than a leak.
- `.env` and `.env.*` are gitignored; only `.env.example`, which holds names and
  no values, is tracked.
- The build output is grepped for every server-only key name at each security
  gate. Zero matches is the expectation, and it is checked rather than assumed.
- Git history has been scanned for `sk-ant-`, `re_`, service-role JWT prefixes,
  `postgresql://` connection strings and `KEY=` assignments. Clean as of this
  review — no secret has ever been committed, so no history rewrite has been
  needed.

---

## Rate limits

Sliding window, per client IP, in Upstash Redis. The IP comes from
`x-forwarded-for`, then `x-real-ip`, then a shared constant — so a request with
neither is limited as a group rather than skipping the check.

| Route | Per minute | Per day |
|---|---|---|
| `/api/lead` | 10 | — |
| `/api/subscribe` | 10 | — |
| `/api/chat` | 10 | 100 |

Exhausting a window returns **429 with `Retry-After`** in seconds.

**These limits fail open, deliberately.** If Upstash is unreachable or
unconfigured, the request is allowed through and the failure is logged once
rather than per request. That is a considered trade, not an oversight: the
worst case of failing open is some junk in a table we can delete; the worst
case of failing closed is dropping a real enquiry because a rate-limit backend
had a bad minute. On a lead form, availability beats strictness — the same
reasoning as hard rule 6.

The chat endpoint is the one with real money attached, which is why it carries
a daily ceiling as well as a per-minute one, and why its replies are capped at
400 tokens with history trimmed to a character budget before it is sent.

---

## HTTP security headers

Set in two places on purpose. The middleware assembles the per-request ones —
the CSP has to be built from the Supabase origin and whether analytics is
configured. `next.config.ts` sets the static baseline, because the middleware's
matcher deliberately excludes `_next/static`, and without that layer every
JavaScript and CSS bundle shipped without `nosniff`.

| Header | Value | Why |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'`; scripts self + `'unsafe-inline'` + Vercel + Google Tag Manager; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `upgrade-insecure-requests` | See the `'unsafe-inline'` note below |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | Two years. **No `preload`** — see below |
| `X-Content-Type-Options` | `nosniff` | Applied to pages, API **and** static assets |
| `X-Frame-Options` | `DENY` | Belt to `frame-ancestors 'none'` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | No path leakage off-site |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | Nothing here needs any of them |

**`'unsafe-inline'` on `script-src` is a documented trade.** Removing it needs
per-request nonces, and minting a nonce per request opts every page out of
static rendering — which is what the LCP budget in ARCH-1 §7 depends on. The
App Router also streams hydration data through inline `<script>` tags that
would otherwise be blocked. Chrome's Issues panel flags the allowlist, which is
why the Lighthouse Best-Practices target is 96 rather than 100. No actual CSP
violation occurs; `'unsafe-eval'` is dev-only and never ships.

**`preload` is deliberately absent.** It declares that the apex *and every
subdomain* is ready to be hard-coded into browsers as HTTPS-only, and getting
off the preload list takes months. `nahltech.com` has not cut over yet and
`www` is currently broken over TLS, so the claim would be false today. Add it
after cutover, once `www` resolves cleanly — not before.

---

## Input handling

Every public route validates with zod **server-side** before any external call,
and unknown keys are stripped rather than rejected, so a stray field from a
browser extension cannot turn a real enquiry into a 400.

- **Message caps.** Chat messages are capped at 1000 characters and history at
  20 turns; both are rejected with 400 rather than truncated.
- **No client-supplied system prompt.** A history turn with `role: "system"` is
  rejected outright rather than quietly stripped — the system prompt is ours.
- **Honeypot.** A hidden `website_url` field. Non-empty means a bot: the
  submission is discarded and the response is a normal 200, so a scraper
  learns nothing from the status code.
- **Email header injection.** Everything a visitor controls is flattened with
  `singleLine()` before it reaches the alert email — CR, LF, the Unicode line
  separators and C0 controls all removed. The subject is a mail header, so
  `X\r\nBcc: evil@example.com` in a name field is an attempt to choose our
  outbound headers. Resend takes JSON over HTTPS rather than us writing SMTP,
  so it is not obviously exploitable today — but that is a property of the
  provider's implementation, not of our code. The message body keeps its line
  breaks (it is prose) but is indented under a delimiter, so a line inside it
  cannot be mistaken for one of the `Label: value` fields above it.

---

## The alert chain fails soft

A lead that reaches the database must never become a 500 because an email
bounced. The chain is:

1. Insert the lead. On failure, **still** send the alert — flagged
   `LEAD INSERT FAILED`, with the enquiry in the body, because that email is
   then the only copy.
2. Send the alert. Nothing in the alert path throws.
3. Record the outcome in `notification_log` with `sent` or `failed` and the
   error, so a silent failure is still visible in the database.
4. Show the visitor a success state either way.

The same principle covers the chat endpoint: an upstream failure returns a
plain sentence and a way to reach a person, never a provider error.

---

## What is deliberately not here

- No user accounts, sessions, or password storage — nothing to breach.
- No payment handling. Money is discussed by humans, off-site.
- No file uploads.
- No admin routes. There is no `/admin`; the database is administered through
  Supabase's own authenticated dashboard.
- No source maps in production (`productionBrowserSourceMaps` stays off).

---

## If something happens

1. **Revoke at the source first, not in our config.** Rotate the key in the
   provider's dashboard — Supabase, Anthropic, Resend, Upstash — so the leaked
   value is dead before anything else. Changing our environment variable first
   leaves the old key valid.
2. **Rotate.** Set the new value in Vercel for all three environments and in
   `.env.local`.
3. **Redeploy.** Environment variables are read at build and runtime; a
   redeploy is what actually puts the new key in service.
4. **Check the blast radius.** For a service-role key: read `leads`,
   `notification_log` and the Supabase logs for access that was not ours. For
   Anthropic: check spend. For Resend: check the send log for mail we did not
   send.
5. **Write down what happened** at the end of this file, with the date. A
   security document with no incident history is either very young or not
   being kept.

No incidents to date.
