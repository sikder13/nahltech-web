-- 0005_dashboard_visits.sql
-- Nahl Technologies web — visit tally for prospect dashboards (/m/<token>).
-- Applied to project nahltech-web (ref posdwhozfmlofsvqfohn).
-- This file is the source of truth. Dashboard SQL editor is verification only.

-- ============================================================
-- A count, not a log.
-- ============================================================
-- The outreach letters promise that no one will call a reader because they
-- visited. This table is built so that promise cannot be broken by accident:
-- it has no column that could identify a visitor. No IP address, no user
-- agent, no hash of either, no session, no referrer. A row says only that
-- the page for a given token was opened at a given time.
--
-- Do not add identifying columns to this table. If a question ever seems to
-- need one, the answer to the question is no.
create table public.dashboard_visits (
  id bigint generated always as identity primary key,
  token text not null check (char_length(token) between 8 and 80),
  visited_at timestamptz not null default now()
);

create index dashboard_visits_token_idx on public.dashboard_visits (token);

-- Same posture as leads and newsletter_subscribers (see 0003): RLS on, no
-- policies, so anon and authenticated can do nothing. The only writer is the
-- service role in /api/visit.
alter table public.dashboard_visits enable row level security;
revoke all on public.dashboard_visits from anon, authenticated;

comment on table public.dashboard_visits is
  'Visit tally for prospect dashboards. Token and timestamp only, by design. No identifying columns.';
