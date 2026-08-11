/**
 * Stand-in for the `server-only` package under Vitest.
 *
 * `server-only` resolves to a module that throws unless the bundler sets the
 * `react-server` export condition. Vitest does not, so importing any of our
 * server modules (lib/supabase/server.ts, lib/leads.ts, lib/alerts.ts) in a
 * test would fail on the import line rather than on anything under test.
 *
 * Aliased in vitest.config.ts. The real guard still applies to the Next build,
 * which is where hard rule 3 actually has to hold.
 */
export {};
