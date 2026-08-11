import "server-only";

import { sendLeadAlert } from "@/lib/alerts";
import { leadServerSchema, type LeadServerInput } from "@/lib/lead-schema";
import { supabaseAdmin } from "@/lib/supabase/server";

import type { LeadInsert } from "@/lib/supabase/types";

/**
 * Lead persistence.
 *
 * `createLead` never throws. Every failure path resolves to `{ ok: false }`
 * so the caller decides the UX, and /api/lead deliberately still shows the
 * visitor a success state (hard rule 6): a lost lead is the one outcome this
 * whole path exists to prevent.
 *
 * When the insert fails, the enquiry is emailed to the founder before this
 * function returns. That email becomes the system of record for that lead.
 */

export type CreateLeadResult =
  { ok: true; id: string } | { ok: false; error: string };

/** Empty strings come back from untouched inputs; store null instead. */
function nullIfBlank(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createLead(
  input: LeadServerInput,
): Promise<CreateLeadResult> {
  // Re-parse rather than trust the caller. /api/lead has already validated,
  // but this is the function that touches the database and it should be safe
  // to call from anywhere.
  const parsed = leadServerSchema.safeParse(input);
  if (!parsed.success) {
    // No PII: field paths only, never the submitted values.
    console.error(
      "[leads] validation failed for fields:",
      parsed.error.issues.map((issue) => issue.path.join(".")).join(", "),
    );
    return { ok: false, error: "invalid_input" };
  }

  const data = parsed.data;

  const row: LeadInsert = {
    name: nullIfBlank(data.name),
    email: nullIfBlank(data.email),
    phone: nullIfBlank(data.phone),
    company: nullIfBlank(data.company),
    message: nullIfBlank(data.message),
    source: data.source,
    service_interest: data.service_interest ?? null,
    landing_page: nullIfBlank(data.landing_page),
    referrer: nullIfBlank(data.referrer),
    utm_source: nullIfBlank(data.utm_source),
    utm_medium: nullIfBlank(data.utm_medium),
    utm_campaign: nullIfBlank(data.utm_campaign),
    locale: nullIfBlank(data.locale) ?? "en",
  };

  const alertPayload = {
    ...row,
    source: data.source,
    created_at: new Date().toISOString(),
  };

  try {
    const { data: inserted, error } = await supabaseAdmin
      .from("leads")
      .insert(row)
      .select("id")
      .single();

    if (error || !inserted?.id) {
      // Log the code and message only. `error.details` echoes the row values
      // back, which would put the visitor's email and message in the logs.
      console.error(
        "[leads] insert failed",
        error?.code ?? "no-row-returned",
        error?.message ?? "",
      );
      await sendLeadAlert(alertPayload, { fallback: true, leadId: null });
      return { ok: false, error: error?.code ?? "insert_failed" };
    }

    return { ok: true, id: inserted.id };
  } catch (thrown) {
    console.error(
      "[leads] insert threw",
      thrown instanceof Error ? thrown.message : String(thrown),
    );
    await sendLeadAlert(alertPayload, { fallback: true, leadId: null });
    return { ok: false, error: "insert_threw" };
  }
}
