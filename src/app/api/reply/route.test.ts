import { beforeEach, describe, expect, it, vi } from "vitest";

import { allLetterPages } from "@/lib/letter-pages/registry";

type LimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };
type InsertResult = {
  data: { id: string } | null;
  error: { code: string; message: string } | null;
};

const checkLimitMock =
  vi.fn<(key: string, config: unknown) => Promise<LimitResult>>();
const sendLeadAlertMock =
  vi.fn<(payload: unknown, options?: unknown) => Promise<void>>();
const leadInsertMock = vi.fn<(row: unknown) => Promise<InsertResult>>();
const eventInsertMock =
  vi.fn<(row: unknown) => Promise<{ error: { code: string } | null }>>();

vi.mock("@/lib/rate-limit", () => ({
  checkLimit: checkLimitMock,
  clientIpFrom: () => "203.0.113.9",
}));

vi.mock("@/lib/alerts", () => ({ sendLeadAlert: sendLeadAlertMock }));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: (table: string) =>
      table === "leads"
        ? {
            insert: (row: unknown) => ({
              select: () => ({ single: () => leadInsertMock(row) }),
            }),
          }
        : { insert: (row: unknown) => eventInsertMock(row) },
  },
}));

// Off Vercel this awaits, so the alert and the event row have settled by the
// time POST resolves.
vi.mock("@/lib/after-response", () => ({
  deliverAfterResponse: (work: Promise<void>) => work,
}));

const page = allLetterPages().find((p) => p.slug === "quinton")!;

function post(body: unknown) {
  return new Request("https://nahltech.com/api/reply", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function loadRoute() {
  const { POST } = await import("./route");
  return POST;
}

describe("POST /api/reply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkLimitMock.mockResolvedValue({ ok: true });
    leadInsertMock.mockResolvedValue({ data: { id: "lead-1" }, error: null });
    eventInsertMock.mockResolvedValue({ error: null });
    sendLeadAlertMock.mockResolvedValue();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("stores the reply as an outreach lead for that page's provider", async () => {
    const POST = await loadRoute();
    const text = "317-555-0142, mornings. You are wrong on overtime.";
    const response = await POST(post({ token: page.token, text }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(leadInsertMock).toHaveBeenCalledWith({
      name: null,
      email: null,
      phone: "317-555-0142",
      company: "Quinton Residential Living",
      message: text,
      source: "outreach",
      landing_page: "/quinton",
      locale: "en",
    });
  });

  it("puts a typed email in the email column", async () => {
    const POST = await loadRoute();
    await POST(post({ token: page.token, text: "kendall@example.org" }));

    expect(leadInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: "kendall@example.org", phone: null }),
    );
  });

  it("keeps a reply that carries no phone or email", async () => {
    const POST = await loadRoute();
    const response = await POST(
      post({ token: page.token, text: "Call the front desk" }),
    );

    expect(response.status).toBe(200);
    expect(leadInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: null,
        phone: null,
        message: "Call the front desk",
      }),
    );
  });

  it("emails the alert and records the same event a contact-form lead gets", async () => {
    const POST = await loadRoute();
    await POST(post({ token: page.token, text: "317-555-0142" }));

    expect(sendLeadAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({ company: "Quinton Residential Living" }),
      { leadId: "lead-1" },
    );
    expect(eventInsertMock).toHaveBeenCalledWith({
      lead_id: "lead-1",
      event_type: "created",
      detail: {},
    });
  });

  it("never writes a column the reader did not fill or the page does not own", async () => {
    const POST = await loadRoute();
    await POST(
      post({
        token: page.token,
        text: "317-555-0142",
        company: "Someone Else LLC",
        source: "contact_form",
        vertical: "waiver",
      }),
    );

    const row = leadInsertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.company).toBe("Quinton Residential Living");
    expect(row.source).toBe("outreach");
    expect(row).not.toHaveProperty("vertical");
  });

  it("discards a honeypot hit with the same answer a real reply gets", async () => {
    const POST = await loadRoute();
    const response = await POST(
      post({ token: page.token, text: "hello", website_url: "http://spam" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(leadInsertMock).not.toHaveBeenCalled();
    expect(sendLeadAlertMock).not.toHaveBeenCalled();
  });

  it("refuses when the rate limit is spent", async () => {
    checkLimitMock.mockResolvedValue({ ok: false, retryAfterSeconds: 30 });
    const POST = await loadRoute();
    const response = await POST(post({ token: page.token, text: "hello" }));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(leadInsertMock).not.toHaveBeenCalled();
    expect(checkLimitMock).toHaveBeenCalledWith("reply:203.0.113.9", {
      perMinute: 10,
    });
  });

  it("rejects a token that is not a letter page", async () => {
    const POST = await loadRoute();
    const response = await POST(
      post({ token: "burnside-collision-35f699795b", text: "hello" }),
    );

    expect(response.status).toBe(400);
    expect(leadInsertMock).not.toHaveBeenCalled();
  });

  it("rejects an empty reply and a body that is not JSON", async () => {
    const POST = await loadRoute();

    expect((await POST(post({ token: page.token, text: "   " }))).status).toBe(
      400,
    );
    expect((await POST(post("not json"))).status).toBe(400);
    expect(leadInsertMock).not.toHaveBeenCalled();
  });

  it("reports a failed insert, after emailing the reply so it is not lost", async () => {
    leadInsertMock.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "boom" },
    });
    const POST = await loadRoute();
    const response = await POST(
      post({ token: page.token, text: "317-555-0142" }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false });
    expect(sendLeadAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: "317-555-0142" }),
      { fallback: true, leadId: null },
    );
    expect(eventInsertMock).not.toHaveBeenCalled();
  });
});
