import { NextResponse } from "next/server";
import { z } from "zod";

import { defaultLocale, isLiveLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { leadFieldLimits } from "@/lib/lead-schema";
import { checkLimit, clientIpFrom } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/subscribe — newsletter signup.
 *
 * The insert uses the service role, matching the /api/lead pattern: anon has
 * no grant on `newsletter_subscribers` at all, so the browser never gets
 * write access to a table full of email addresses (hard rule 4).
 *
 * A valid email always answers 200, whether it was new or already on the
 * list. Reporting "already subscribed" would turn this into an oracle for
 * checking whether a given address is in the database.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  email: z.string().trim().min(1).max(leadFieldLimits.email).pipe(z.email()),
  source_page: z.string().trim().max(500).optional().or(z.literal("")),
  locale: z.string().trim().max(10).optional().or(z.literal("")),
  /** Same trap as /api/lead. Never persisted. */
  website_url: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const t = await getDictionary(defaultLocale);

  const ip = clientIpFrom(request.headers);
  const limit = await checkLimit(`subscribe:${ip}`, { perMinute: 10 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, message: t.leadForm.rateLimited },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const trap = (body as { website_url?: unknown } | null)?.website_url;
  if (typeof trap === "string" && trap.trim() !== "") {
    console.info("[subscribe] honeypot triggered, submission discarded");
    return NextResponse.json({ ok: true });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { email, source_page, locale } = parsed.data;

  try {
    const { error } = await supabaseAdmin.from("newsletter_subscribers").upsert(
      {
        email: email.toLowerCase(),
        source_page: source_page?.trim() || null,
        locale: isLiveLocale(locale ?? "") ? locale : defaultLocale,
      },
      { onConflict: "email", ignoreDuplicates: true },
    );

    if (error) {
      console.error("[subscribe] upsert failed", error.code);
    }
  } catch (error) {
    console.error(
      "[subscribe] upsert threw",
      error instanceof Error ? error.message : String(error),
    );
  }

  // Deliberately unconditional: a storage failure is ours to fix from the
  // logs, not something to surface to someone who just typed their email.
  return NextResponse.json({ ok: true });
}
