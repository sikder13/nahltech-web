import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LeadServerInput } from "./lead-schema";

const insertMock = vi.fn();
const sendLeadAlertMock =
  vi.fn<
    (
      payload: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => Promise<void>
  >();

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: () => ({
      insert: (row: unknown) => ({
        select: () => ({
          single: () => insertMock(row),
        }),
      }),
    }),
  },
}));

vi.mock("@/lib/alerts", () => ({
  sendLeadAlert: sendLeadAlertMock,
}));

const validInput: LeadServerInput = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "",
  company: "Analytical Engines",
  message: "Interested in the audit.",
  source: "contact_form",
  landing_page: "/contact",
  referrer: "",
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  locale: "en",
  website_url: "",
};

async function loadCreateLead() {
  const { createLead } = await import("./leads");
  return createLead;
}

describe("createLead", () => {
  beforeEach(() => {
    insertMock.mockReset();
    sendLeadAlertMock.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an invalid email before making any network call", async () => {
    const createLead = await loadCreateLead();

    const result = await createLead({ ...validInput, email: "not-an-email" });

    expect(result).toEqual({ ok: false, error: "invalid_input" });
    // The point of validating first: nothing reaches the database.
    expect(insertMock).not.toHaveBeenCalled();
    // A malformed payload is a client bug, not a lost lead — no alert.
    expect(sendLeadAlertMock).not.toHaveBeenCalled();
  });

  it("keeps submitted values out of the log line", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const createLead = await loadCreateLead();

    await createLead({
      ...validInput,
      email: "leaky-at-example.com",
      message: "sensitive business detail",
    });

    const logged = errorLog.mock.calls.flat().join(" ");
    // Field paths are useful for debugging; the values behind them are not
    // ours to put in a log aggregator.
    expect(logged).toContain("email");
    expect(logged).not.toContain("leaky-at-example.com");
    expect(logged).not.toContain("sensitive business detail");
  });

  it("stores blank optional fields as null and returns the new id", async () => {
    insertMock.mockResolvedValue({ data: { id: "lead-1" }, error: null });
    const createLead = await loadCreateLead();

    const result = await createLead(validInput);

    expect(result).toEqual({ ok: true, id: "lead-1" });
    const row = insertMock.mock.calls[0][0];
    expect(row.phone).toBeNull();
    expect(row.company).toBe("Analytical Engines");
    expect(row.locale).toBe("en");
    // The honeypot is never persisted — it is not a column on `leads`.
    expect(row).not.toHaveProperty("website_url");
  });

  it("fires the fallback alert and returns ok:false when the insert errors", async () => {
    insertMock.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    });
    const createLead = await loadCreateLead();

    const result = await createLead(validInput);

    expect(result).toEqual({ ok: false, error: "23505" });
    expect(sendLeadAlertMock).toHaveBeenCalledTimes(1);
    const [payload, options] = sendLeadAlertMock.mock.calls[0];
    // The email has to carry the whole enquiry — it is the only copy left.
    expect(payload.email).toBe("ada@example.com");
    expect(payload.message).toBe("Interested in the audit.");
    expect(options).toEqual({ fallback: true, leadId: null });
  });

  it("never throws, even when the client itself throws", async () => {
    insertMock.mockRejectedValue(new Error("socket hang up"));
    const createLead = await loadCreateLead();

    // Hard rule 6: this function has no failure mode that reaches the caller
    // as an exception.
    const result = await createLead(validInput);

    expect(result).toEqual({ ok: false, error: "insert_threw" });
    expect(sendLeadAlertMock).toHaveBeenCalledTimes(1);
  });
});
