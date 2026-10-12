# DEMO-1: forwarding /demo and counting visits

`/demo/*` is served by a separate deployment. This repository is public and holds none of
what is behind that path: no business name, no page address, no content. It holds two
generic things, a forwarding rule and a visit endpoint.

## Forwarding

`next.config.ts` rewrites `/demo/:path*` to the same path on the origin named in the
`DEMO_ORIGIN` environment variable. The variable is set in the Vercel project settings and
is not written anywhere in the repository. If it is unset, or is not an https origin,
there is no rule and `/demo` is an ordinary 404.

Requests for pages pass through the middleware, which skips the locale rewrite for
`/demo` and applies the usual security headers. Requests for files with an extension
bypass the middleware and go straight to the rewrite.

A trailing slash on a page address is removed by a redirect before the forward, as it is
everywhere else on the site.

## Keeping it out of search

- Every `/demo` response carries `X-Robots-Tag: noindex, nofollow`: pages from the
  middleware, and everything including assets from the header rule in `next.config.ts`.
- `robots.txt` carries `Disallow: /demo/` in every group. A crawler named in its own
  group does not read the wildcard group, so the line is repeated.
- Nothing under `/demo` is in the sitemap or in `llms.txt`, and no page, component or
  piece of content links there. `src/lib/demo-forward.test.ts` fails if that changes.

## Visits

`POST /api/demo-visit` accepts `{ token, kind }` and adds a row to `dashboard_visits`.

- `token` must match `^[a-z0-9-]{3,80}$`. The table itself requires at least 8 characters.
- `kind` is `view`, `tab_findings` or `cta_click`. Migration 0007 adds it as a nullable
  column, so rows written by the older `/api/visit` routes are unchanged.
- Thirty requests per token per hour, through the shared Upstash limiter, keyed on the
  token and nothing about the caller.
- Requests whose user agent is a crawler or a script are not counted.
- The answer is always 204 with no body.
- Rows are written on the production deployment only.

The page that calls it waits until it has been on screen for three seconds, which is what
keeps mail link scanners out of the count. That check is in the page, not here.

As with the other visit routes, nothing that identifies a visitor is stored: no IP
address, no user agent, no hash of either. RLS stays on with no policies; only the service
role writes.

To read the tally (service role, in the Supabase SQL editor):

```sql
select token,
       min(visited_at) filter (where kind is null or kind = 'view') as first_view,
       max(visited_at) filter (where kind is null or kind = 'view') as last_view,
       count(*) filter (where kind is null or kind = 'view') as views,
       bool_or(kind = 'tab_findings') as findings_tab,
       bool_or(kind = 'cta_click') as reply_or_call
from public.dashboard_visits
group by token
order by last_view desc;
```
