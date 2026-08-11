import { createClient } from "@supabase/supabase-js";

/**
 * Anon Supabase client for the browser.
 *
 * Its entire job is logging chat conversations and messages. The anon role has
 * INSERT on `chat_conversations` and `chat_messages` and nothing else — no
 * SELECT on any table, no access to `leads` (hard rule 4). Lead capture goes
 * through /api/lead so it gets rate limiting, server-side validation and the
 * service role; the browser never needs insert access to `leads` at all
 * (ARCH-1 §4.1).
 *
 * Because anon cannot SELECT, `INSERT ... RETURNING` fails for this client.
 * Callers generate their own UUIDs and insert them explicitly.
 *
 * Returns null when the public env vars are absent, so chat logging degrades
 * to a no-op rather than throwing inside a render.
 */

let cached: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  cached = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
