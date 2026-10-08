import { NextResponse } from "next/server";
import { z } from "zod";

import { leadFieldLimits } from "@/lib/lead-schema";
import { letterPageByToken } from "@/lib/letter-pages/registry";
import { createLetterReply } from "@/lib/letter-pages/reply";
import { checkLimit, clientIpFrom } from "@/lib/rate-limit";

/**
 * POST /api/reply — the one-line reply box on a letter page.
 *
 * Same order as /api/lead: rate limit, discard bots, validate, insert,
 * alert. The page is identified by its token and everything about the
 * provider is read from the config on the server, so a request cannot file a
 * reply under a company of its choosing.
 *
 * Unlike /api/lead this reports a failed insert. The reply box sits beside
 * a phone number, and a reader told plainly to text instead is better served
 * than one told "got it" on the strength of a fallback email alone.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const replySchema = z.object({
  token: z.string().regex(/^[a-z0-9-]{8,80}$/),
  text: z.string().trim().min(1).max(leadFieldLimits.message),
});

export async function POST(request: Request) {
  const ip = clientIpFrom(request.headers);
  const limit = await checkLimit(`reply:${ip}`, { perMinute: 10 });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false },
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

  // Honeypot first, answered exactly like a real submission. See /api/lead.
  const trap = (body as { website_url?: unknown } | null)?.website_url;
  if (typeof trap === "string" && trap.trim() !== "") {
    console.info("[reply] honeypot triggered, submission discarded");
    return NextResponse.json({ ok: true });
  }

  const parsed = replySchema.safeParse(body);
  const page = parsed.success
    ? letterPageByToken(parsed.data.token)
    : undefined;
  if (!parsed.success || !page) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const result = await createLetterReply(page, parsed.data.text);
  if (!result.ok) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
