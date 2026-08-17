-- 0004_service_page_source.sql
--
-- The five service pages now carry their own lead form, so a lead can arrive
-- from /services/ai-automation rather than from /contact. `source` is the
-- field a CRM view groups by, and without this those leads would be
-- indistinguishable from contact-page ones without joining on landing_page.
--
-- Additive only, like 0002. Note the one-way door: Postgres cannot drop an
-- enum value without recreating the type, which is why 'local_seo' is still
-- listed in lead_source's sibling enum long after the service was folded
-- away. Adding a value here is a decision that outlives the feature.
--
-- ADD VALUE cannot run inside a transaction block on older Postgres, so if a
-- migration runner wraps this file, run the statement on its own.

ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'service_page';
