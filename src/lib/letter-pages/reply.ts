import "server-only";

import { sendLeadAlert } from "@/lib/alerts";
import { deliverAfterResponse } from "@/lib/after-response";
import { leadFieldLimits } from "@/lib/lead-schema";
import { supabaseAdmin } from "@/lib/supabase/server";

import { parseReply } from "./parse-reply";

import type { LetterPageIdentity } from "./registry";
import type { LeadInsert } from "@/lib/supabase/types";

/**
 * Stores a one-line reply from a letter page as a lead.
 *
 * The same insert, alert email and `lead_events` row the contact form
 * produces, for a reply that may carry no name and no email. The contact
 * form's own path requires both, so this sits beside it rather than
 * loosening it.
 *
 * Never throws. When the insert fails the reply is emailed before this
 * returns, so it is not lost, and the caller tells the reader to text
 * instead.
 */
export async function createLetterReply(
  page: LetterPageIdentity,
  text: string,
): Promise<{ ok: true; id: string } | { ok: false }> {
  const { email, phone } = parseReply(text);

  const row: LeadInsert = {
    name: null,
    email: email && email.length <= leadFieldLimits.email ? email : null,
    phone,
    company: page.company.name,
    message: text,
    source: "outreach",
    landing_page: `/${page.slug}`,
    locale: "en",
  };

  const alertPayload = { ...row, created_at: new Date().toISOString() };

  try {
    const { data: inserted, error } = await supabaseAdmin
      .from("leads")
      .insert(row)
      .select("id")
      .single();

    if (error || !inserted?.id) {
      // Code and message only; `error.details` echoes the row values back.
      console.error(
        "[reply] insert failed",
        error?.code ?? "no-row-returned",
        error?.message ?? "",
      );
      await sendLeadAlert(alertPayload, { fallback: true, leadId: null });
      return { ok: false };
    }

    const id: string = inserted.id;

    await deliverAfterResponse(
      (async () => {
        await sendLeadAlert(alertPayload, { leadId: id });

        const { error: eventError } = await supabaseAdmin
          .from("lead_events")
          .insert({ lead_id: id, event_type: "created", detail: {} });
        if (eventError) {
          console.error("[reply] lead_events insert failed", eventError.code);
        }
      })(),
    );

    return { ok: true, id };
  } catch (thrown) {
    console.error(
      "[reply] insert threw",
      thrown instanceof Error ? thrown.message : String(thrown),
    );
    await sendLeadAlert(alertPayload, { fallback: true, leadId: null });
    return { ok: false };
  }
}
