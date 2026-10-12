-- 0007_dashboard_visits_kind.sql
-- Nahl Technologies web — say what a visit row records.
-- This file is the source of truth. Dashboard SQL editor is verification only.

-- ============================================================
-- One nullable word, and still nothing about the visitor.
-- ============================================================
-- The demo pages under /demo report three things: the page was viewed, the
-- findings tab was opened, a reply or call button was pressed. `kind` holds
-- which. It describes the action, never the person, so the rule in 0005
-- stands: no column on this table can identify a visitor.
--
-- Nullable with no default, so every existing row stays as it is and the
-- three /api/visit routes, which do not send a kind, keep working unchanged.
-- A null kind means a plain page opening, which is what those rows are.
alter table public.dashboard_visits
  add column kind text
  check (kind is null or kind in ('view', 'tab_findings', 'cta_click'));

comment on column public.dashboard_visits.kind is
  'What the row records: view, tab_findings or cta_click. Null for rows written before this column and by /api/visit.';

-- RLS is already on with no policies, and anon and authenticated hold no
-- grants (0005, 0006). Adding a column changes none of that. The only writer
-- remains the service role in the API routes.
