import { beforeEach, describe, expect, it, vi } from "vitest";

import en from "@/lib/i18n/dictionaries/en.json";

type LimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };
type LeadResult = { ok: true; id: string } | { ok: false; error: string };

const checkLimitMock =
  vi.fn<(key: string, config: unknown) => Promise<LimitResult>>();
const createLeadMock = vi.fn<(input: unknown) => Promise<LeadResult>>();
const sendLeadAlertMock =
  vi.fn<(payload: unknown, options?: unknown) => Promise<void>>();
const leadEventInsertMock =
  vi.fn<(row: unknown) => Promise<{ error: { code: string } | null }>>();

vi.mock("@/lib/rate-limit", () => ({
  checkLimit: checkLimitMock,
  clientIpFrom: () => "203.0.113.9",
}));

vi.mock("@/lib/leads", () => ({ createLead: createLeadMock }));

vi.mock("@/lib/alerts", () => ({ sendLeadAlert: sendLeadAlertMock }));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: () => ({ insert: (row: unknown) => leadEventInsertMock(row) }),
  },
}));

// Off Vercel this awaits, which is what the tests want: the alert and the
// lead_events insert have both settled by the time POST resolves.
vi.mock("@/lib/after-response", () => ({
  deliverAfterResponse: (work: Promise<void>) => work,
}));

const validBody = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "",
  company: "",
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

function post(body: unknown) {
  return new Request("https://nahltech.com/api/lead", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function loadRoute() {
  const { POST } = await import("./route");
  return POST;
}

describe("POST /api/lead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkLimitMock.mockResolvedValue({ ok: true });
    createLeadMock.mockResolvedValue({ ok: true, id: "lead-1" });
    leadEventInsertMock.mockResolvedValue({ error: null });
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects an invalid email with 400 and writes nothing", async () => {
    const POST = await loadRoute();

    const response = await POST(post({ ...validBody, email: "nope" }));

    expect(response.status).toBe(400);
    expect(createLeadMock).not.toHaveBeenCalled();
  });

  it("inserts a valid lead, records the event and alerts", async () => {
    const POST = await loadRoute();

    const response = await POST(post(validBody));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, id: "lead-1" });
    expect(createLeadMock).toHaveBeenCalledTimes(1);
    expect(sendLeadAlertMock).toHaveBeenCalledTimes(1);
    expect(leadEventInsertMock).toHaveBeenCalledWith({
      lead_id: "lead-1",
      event_type: "created",
      detail: {},
    });
  });

  it("silently discards a submission with the honeypot filled", async () => {
    const POST = await loadRoute();

    const response = await POST(
      post({ ...validBody, website_url: "http://spam.example" }),
    );

    // Indistinguishable from success, so the bot learns nothing.
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(createLeadMock).not.toHaveBeenCalled();
    expect(sendLeadAlertMock).not.toHaveBeenCalled();
  });

  it("discards a trapped submission even when the rest is invalid", async () => {
    const POST = await loadRoute();

    // Checking the trap before validation means a malformed bot payload still
    // gets a 200 rather than a 400 that confirms validation exists.
    const response = await POST(
      post({ website_url: "http://spam.example", email: "nope" }),
    );

    expect(response.status).toBe(200);
    expect(createLeadMock).not.toHaveBeenCalled();
  });

  it("still reports success when the insert failed, without inventing an id", async () => {
    createLeadMock.mockResolvedValue({ ok: false, error: "23505" });
    const POST = await loadRoute();

    const response = await POST(post(validBody));

    // Hard rule 6: createLead has already emailed the enquiry, so the visitor
    // sees success and recovery is ours to do.
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({ ok: true });
    expect(payload).not.toHaveProperty("id");
    // No duplicate alert — the fallback one came from inside createLead.
    expect(sendLeadAlertMock).not.toHaveBeenCalled();
  });

  it("answers 429 with Retry-After and the dictionary message", async () => {
    checkLimitMock.mockResolvedValue({ ok: false, retryAfterSeconds: 37 });
    const POST = await loadRoute();

    const response = await POST(post(validBody));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("37");
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: en.leadForm.rateLimited,
    });
    expect(createLeadMock).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const POST = await loadRoute();

    const response = await POST(
      new Request("https://nahltech.com/api/lead", {
        method: "POST",
        body: "not json",
      }),
    );

    expect(response.status).toBe(400);
  });
});
