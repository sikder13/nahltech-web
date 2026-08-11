import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
 *
 * Construction is deferred to first use rather than module load. `next build`
 * evaluates every route module while collecting page data, including
 * force-dynamic ones, so validating at import time fails the build anywhere
 * the credentials are absent — which is exactly the case in CI. The proxy
 * below keeps the eager-failure behaviour where it is useful (the first real
 * query raises a precise, named error instead of an opaque PostgREST 401)
 * without coupling a build to secrets it does not need.
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

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  client = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        // No user sessions here — this client is only ever used for
        // request-scoped writes and server-side reads.
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
  return client;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const instance = getClient();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

/** Test seam: drops the memoised client so env stubs take effect. */
export function resetSupabaseAdminForTests() {
  client = null;
}
