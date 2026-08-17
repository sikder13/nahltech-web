import "server-only";

import { Resend } from "resend";

import { contactDetails } from "@/lib/routes";
import { supabaseAdmin } from "@/lib/supabase/server";

import type { NotificationLogInsert } from "@/lib/supabase/types";

/**
 * Lead alerting over Resend.
 *
 * Email is the only alert channel — there is no SMS or push path. Every send
 * is recorded in `notification_log` with its outcome so a silent failure is
 * still visible in the database.
 *
 * Nothing in here throws. A lead that reached the database must never be
 * turned into a 500 because an email bounced (hard rule 6), and while the
 * nahltech.com sending domain is still being verified, `failed` rows are the
 * expected result rather than an incident.
 */

const FROM = "Nahl Website <leads@nahltech.com>";
const TO = contactDetails.email;

export type LeadAlertPayload = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  source: string;
  service_interest?: string | null;
  landing_page?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  locale?: string | null;
  created_at?: string;
};

export type LeadAlertOptions = {
  /** Null when the insert failed and there is no row to point at. */
  leadId?: string | null;
  /**
   * Set when the database insert failed and this email is the only surviving
   * copy of the enquiry. Changes the subject and channel so these stand out
   * in both the inbox and `notification_log`.
   */
  fallback?: boolean;
};

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

/**
 * Flatten a visitor-supplied value to a single safe line.
 *
 * Two separate problems, one fix.
 *
 * The subject line is a mail header. A name containing CR/LF — the classic
 * `X\r\nBcc: evil@example.com` — is an attempt to append headers of the
 * attacker's choosing to our outbound mail. Resend takes JSON over HTTPS
 * rather than us writing SMTP by hand, so it is not obviously exploitable
 * today; that is a property of the provider's implementation, not of our code,
 * and it is not something to depend on.
 *
 * The body has a quieter version of the same problem. Every field renders as
 * `Label: value` on its own line, so a newline inside a value lets a visitor
 * forge a line that reads exactly like one of ours — `Lead id: …` pointing at
 * a row that is not theirs, in the email a human acts on.
 *
 * Also strips other C0 control characters and the Unicode line separators,
 * which some clients treat as line breaks.
 */
export function singleLine(value: string | null | undefined): string {
  return (
    (value ?? "")
      // CR, LF, and the Unicode line/paragraph separators some clients
      // render as breaks.
      .replace(/[\r\n\u2028\u2029]+/g, " ")
      // Remaining C0 controls and DEL.
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function subjectFor(lead: LeadAlertPayload, fallback: boolean): string {
  const who =
    singleLine(lead.company) || singleLine(lead.name) || "no name given";
  const prefix = fallback ? "LEAD INSERT FAILED" : "New lead";
  return `${prefix}: ${who} — ${singleLine(lead.source)}`;
}

function bodyFor(
  lead: LeadAlertPayload,
  options: LeadAlertOptions,
  createdAt: string,
): string {
  const lines: string[] = [];

  if (options.fallback) {
    lines.push(
      "This lead could NOT be written to the database. This email is the only",
      "copy of it. Add it by hand before doing anything else.",
      "",
    );
  }

  // Everything except the message is a single-line field by nature, so any
  // line break in one is either corruption or an attempt to forge a field.
  const fields: Array<[string, string | null | undefined]> = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phone],
    ["Company", lead.company],
    ["Service interest", lead.service_interest],
    ["Source", lead.source],
    ["Landing page", lead.landing_page],
    ["Referrer", lead.referrer],
    ["utm_source", lead.utm_source],
    ["utm_medium", lead.utm_medium],
    ["utm_campaign", lead.utm_campaign],
    ["Locale", lead.locale],
    ["Created at", createdAt],
    ["Lead id", options.leadId ?? "not stored"],
  ];

  for (const [label, value] of fields) {
    lines.push(`${label}: ${singleLine(value) || "—"}`);
  }

  // The message keeps its line breaks — it is prose, and flattening a
  // paragraph into one line makes the thing the founder actually reads worse.
  // Instead it goes last, after a delimiter, with every line indented, so a
  // line inside it can never be mistaken for one of the fields above.
  const message = (lead.message ?? "")
    // Strip controls but keep \n and \t, which are legitimate in prose.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim();

  lines.push("", "--- message ---");
  lines.push(
    message
      ? message
          .split(/\r?\n/)
          .map((line) => `  ${line}`)
          .join("\n")
      : "  —",
  );

  return lines.join("\n");
}

async function recordOutcome(entry: NotificationLogInsert): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from("notification_log")
      .insert(entry);
    if (error) {
      console.error("[alerts] could not write notification_log", error.code);
    }
  } catch (error) {
    console.error("[alerts] could not write notification_log", error);
  }
}

/**
 * Email the founder about a new lead and log the outcome. Always resolves.
 */
export async function sendLeadAlert(
  lead: LeadAlertPayload,
  options: LeadAlertOptions = {},
): Promise<void> {
  const channel = options.fallback ? "email_fallback" : "email";
  const leadId = options.leadId ?? null;
  const createdAt = lead.created_at ?? new Date().toISOString();

  const client = getResend();
  if (!client) {
    await recordOutcome({
      lead_id: leadId,
      channel,
      status: "failed",
      error: "RESEND_API_KEY is not set",
    });
    return;
  }

  try {
    const { error } = await client.emails.send({
      from: FROM,
      to: TO,
      // A header, like the subject. zod already validates this as an email
      // upstream, so this is depth rather than the only guard.
      replyTo: singleLine(lead.email) || undefined,
      subject: subjectFor(lead, Boolean(options.fallback)),
      text: bodyFor(lead, options, createdAt),
    });

    if (error) {
      // Most likely while the sending domain is still unverified. Record it
      // and move on — the visitor already saw a success state.
      await recordOutcome({
        lead_id: leadId,
        channel,
        status: "failed",
        error: `${error.name}: ${error.message}`.slice(0, 500),
      });
      return;
    }

    await recordOutcome({ lead_id: leadId, channel, status: "sent" });
  } catch (error) {
    await recordOutcome({
      lead_id: leadId,
      channel,
      status: "failed",
      error: (error instanceof Error ? error.message : String(error)).slice(
        0,
        500,
      ),
    });
  }
}
