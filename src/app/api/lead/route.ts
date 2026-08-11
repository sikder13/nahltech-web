import { NextResponse } from "next/server";

import { sendLeadAlert } from "@/lib/alerts";
import { defaultLocale, isLiveLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { leadServerSchema } from "@/lib/lead-schema";
import { createLead } from "@/lib/leads";
import { checkLimit, clientIpFrom } from "@/lib/rate-limit";
import { deliverAfterResponse } from "@/lib/after-response";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/lead — the money path (ARCH-1 §4.1).
 *
 * Order of operations: rate limit, discard bots, re-validate, insert, alert.
 *
 * The response is 200 whether or not the insert succeeded. That is deliberate
 * (hard rule 6): by the time the insert fails, `createLead` has already
 * emailed the enquiry to the founder, so the lead is recoverable and there is
 * nothing useful the visitor could do with an error. `id` is present only when
 * a row genuinely exists — the success state never carries a fabricated one.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const locale = defaultLocale;
  const t = await getDictionary(locale);

  const ip = clientIpFrom(request.headers);
  const limit = await checkLimit(`lead:${ip}`, { perMinute: 10 });
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

  /**
   * Honeypot, checked against the raw body before validation runs.
   *
   * Doing it first rather than after the schema means a bot that fills the
   * trap gets an identical 200 no matter what else it sent. Validating first
   * would answer a malformed bot submission with a 400 and quietly confirm
   * that a validation layer exists.
   */
  const trap = (body as { website_url?: unknown } | null)?.website_url;
  if (typeof trap === "string" && trap.trim() !== "") {
    console.info("[lead] honeypot triggered, submission discarded");
    return NextResponse.json({ ok: true });
  }

  const parsed = leadServerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const submittedLocale = parsed.data.locale ?? "";
  const input = {
    ...parsed.data,
    locale: isLiveLocale(submittedLocale) ? submittedLocale : locale,
  };

  const result = await createLead(input);

  if (!result.ok) {
    // The fallback email already went out from inside createLead. Show
    // success anyway; recovery is a manual step on our side, not the
    // visitor's problem.
    return NextResponse.json({ ok: true });
  }

  await deliverAfterResponse(
    (async () => {
      await sendLeadAlert(
        { ...input, created_at: new Date().toISOString() },
        { leadId: result.id },
      );

      const { error } = await supabaseAdmin
        .from("lead_events")
        .insert({ lead_id: result.id, event_type: "created", detail: {} });
      if (error) {
        console.error("[lead] lead_events insert failed", error.code);
      }
    })(),
  );

  return NextResponse.json({ ok: true, id: result.id });
}
