import { z } from "zod";

import { isReaderAgent } from "@/lib/dashboards/v2/readers";
import { dashboardByToken } from "@/lib/dashboards/v2/registry";
import { checkLimit, clientIpFrom } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/visit2 — template 2 twin of /api/visit (which is frozen with
 * EckCo): a bare count of prospect dashboard openings.
 *
 * Stores the dashboard token and the time. Not the IP address, not the user
 * agent, not a hash of either. The user agent is read only to skip bots. The
 * IP is read only to key the rate limiter, which Upstash holds for its
 * one-minute window and then forgets; it never reaches our database.
 *
 * Always answers 204, whatever happened. A beacon has no reader, and an
 * error body would only tell a prober which tokens exist.
 *
 * Counts only on the production deployment, so preview builds and local
 * work never write to the table.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const visitSchema = z.object({
  token: z.string().regex(/^[a-z0-9-]{8,80}$/),
});

const noContent = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  const ip = clientIpFrom(request.headers);
  const limit = await checkLimit(`visit:${ip}`, { perMinute: 10 });
  if (!limit.ok) return noContent();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noContent();
  }

  const parsed = visitSchema.safeParse(body);
  const dashboard = parsed.success
    ? dashboardByToken(parsed.data.token)
    : undefined;
  if (!parsed.success || !dashboard) return noContent();

  // Crawlers and automated browsers are not readers.
  if (!isReaderAgent(request.headers.get("user-agent"))) {
    return noContent();
  }

  if (process.env.VERCEL_ENV !== "production") return noContent();

  try {
    const { error } = await supabaseAdmin
      .from("dashboard_visits")
      .insert({ token: parsed.data.token });
    if (error) console.error("[visit] insert failed", error.code);
  } catch (error) {
    console.error(
      "[visit] insert threw",
      error instanceof Error ? error.message : String(error),
    );
  }

  return noContent();
}
