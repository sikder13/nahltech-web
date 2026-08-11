import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. SERVER ONLY.
 *
 * The service role bypasses row level security entirely, so this file must
 * never reach the browser bundle. `import "server-only"` on the first line is
 * the enforcement (hard rule 3): any client component that imports this,
 * directly or transitively, fails the build instead of shipping the key.
 *
 * Every read in the app happens through this client. The anon role has zero
 * SELECT policies by design — RLS cannot restrict columns, so an anon SELECT
 * policy on `leads` would expose every column on the table (hard rule 4).
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Set it in .env.local for local work and in the Vercel project settings for deploys.`,
    );
  }
  return value;
}

// Validated at module load so a misconfigured deploy fails on the first
// request with a precise message, rather than surfacing later as an opaque
// auth error from PostgREST.
const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    // No user sessions here — this client is only ever used for
    // request-scoped writes and server-side reads.
    persistSession: false,
    autoRefreshToken: false,
  },
});
