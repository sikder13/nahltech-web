import { isReaderAgent } from "@/lib/dashboards/v2/readers";
import {
  DEMO_VISITS_PER_TOKEN_PER_HOUR,
  demoVisitSchema,
} from "@/lib/demo-visit";
import { checkLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/demo-visit — a tally of what happened on a demo page.
 *
 * The same idea as /api/visit: the token, the time, and here one word saying
 * what was done (the page was viewed, the findings tab was opened, a reply
 * button was pressed). Not the IP address, not the user agent, not a hash of
 * either. The user agent is read only to skip bots and is not stored.
 *
 * The page waits until it has been on screen for three seconds before it
 * calls this, which is what keeps mail scanners out; that check lives in the
 * page. This side holds the limit: thirty reports per token per hour, keyed
 * on the token alone so nothing about the caller is kept even in the limiter.
 *
 * Always answers 204 with no body, whatever happened. A beacon has no reader,
 * and a different answer would tell a prober which requests were accepted.
 *
 * Counts only on the production deployment, so preview builds and local work
 * never write to the table.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noContent = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noContent();
  }

  const parsed = demoVisitSchema.safeParse(body);
  if (!parsed.success) return noContent();

  // Crawlers and automated browsers are not readers.
  if (!isReaderAgent(request.headers.get("user-agent"))) return noContent();

  const limit = await checkLimit(`demo-visit:${parsed.data.token}`, {
    perHour: DEMO_VISITS_PER_TOKEN_PER_HOUR,
  });
  if (!limit.ok) return noContent();

  if (process.env.VERCEL_ENV !== "production") return noContent();

  try {
    const { error } = await supabaseAdmin
      .from("dashboard_visits")
      .insert({ token: parsed.data.token, kind: parsed.data.kind });
    if (error) console.error("[demo-visit] insert failed", error.code);
  } catch (error) {
    console.error(
      "[demo-visit] insert threw",
      error instanceof Error ? error.message : String(error),
    );
  }

  return noContent();
}
