-- 0002_service_enum.sql
--
-- The service line changed from four to five: Local SEO folded into AI Search
-- Visibility & SEO, and AI Consultancy and Software Development were added.
--
-- Only additions here. 'local_seo' is deliberately left in place: enum values
-- cannot be dropped in Postgres without recreating the type, and existing
-- lead rows may already reference it. New leads use the new values.
--
-- ADD VALUE cannot run inside a transaction block in older Postgres, so if a
-- migration runner wraps this file, run the statements individually.

ALTER TYPE service_interest ADD VALUE IF NOT EXISTS 'ai_consultancy';
ALTER TYPE service_interest ADD VALUE IF NOT EXISTS 'software_development';
