-- 0006_dashboard_visits_sequence.sql
-- Nahl Technologies web — close the default sequence grants on dashboard_visits.
-- Applied to project nahltech-web (ref posdwhozfmlofsvqfohn).
-- This file is the source of truth. Dashboard SQL editor is verification only.

-- 0005 revoked every table privilege from anon and authenticated, but the
-- identity column's sequence was created under Supabase's default
-- privileges, which grant USAGE on new sequences in public to both roles.
-- That grant opens nothing on the table itself, yet the table's posture is
-- "the service role only", and the sequence should say the same.
revoke all on sequence public.dashboard_visits_id_seq from anon, authenticated;
