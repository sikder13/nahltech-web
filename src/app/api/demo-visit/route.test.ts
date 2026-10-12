import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const checkLimit = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: { from: () => ({ insert }) },
}));
vi.mock("@/lib/rate-limit", () => ({
  checkLimit: (...args: unknown[]) => checkLimit(...args),
}));

import { POST } from "./route";

const BROWSER =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

function post(body: unknown, userAgent: string | null = BROWSER) {
  return POST(
    new Request("https://nahltech.com/api/demo-visit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(userAgent ? { "user-agent": userAgent } : {}),
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function expectEmpty204(response: Response) {
  expect(response.status).toBe(204);
  expect(await response.text()).toBe("");
}

describe("POST /api/demo-visit", () => {
  beforeEach(() => {
    insert.mockReset().mockResolvedValue({ error: null });
    checkLimit.mockReset().mockResolvedValue({ ok: true });
    vi.stubEnv("VERCEL_ENV", "production");
  });

  it("stores the token and the kind, and nothing else", async () => {
    await expectEmpty204(await post({ token: "test-demo-xyz", kind: "view" }));
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith({
      token: "test-demo-xyz",
      kind: "view",
    });
  });

  it("limits each token to thirty an hour, keyed on the token alone", async () => {
    await post({ token: "test-demo-xyz", kind: "cta_click" });
    expect(checkLimit).toHaveBeenCalledWith("demo-visit:test-demo-xyz", {
      perHour: 30,
    });
  });

  it("answers 204 and stores nothing once the limit is reached", async () => {
    checkLimit.mockResolvedValue({ ok: false, retryAfterSeconds: 60 });
    await expectEmpty204(await post({ token: "test-demo-xyz", kind: "view" }));
    expect(insert).not.toHaveBeenCalled();
  });

  it.each([
    ["an uppercase token", { token: "Test-Demo", kind: "view" }],
    ["a token with a slash", { token: "test/demo", kind: "view" }],
    ["a token that is too short", { token: "ab", kind: "view" }],
    ["a token that is too long", { token: "a".repeat(81), kind: "view" }],
    ["an unknown kind", { token: "test-demo-xyz", kind: "purchase" }],
    ["a missing kind", { token: "test-demo-xyz" }],
    ["a body that is not JSON", "not json"],
  ])("rejects %s with the same empty 204", async (_name, body) => {
    await expectEmpty204(await post(body));
    expect(insert).not.toHaveBeenCalled();
    expect(checkLimit).not.toHaveBeenCalled();
  });

  it.each([
    ["a crawler", "Mozilla/5.0 (compatible; Googlebot/2.1)"],
    ["a script", "curl/8.5.0"],
    ["no user agent at all", null],
  ])("does not count %s", async (_name, userAgent) => {
    await expectEmpty204(
      await post({ token: "test-demo-xyz", kind: "view" }, userAgent),
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it("writes nothing outside the production deployment", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    await expectEmpty204(await post({ token: "test-demo-xyz", kind: "view" }));
    expect(insert).not.toHaveBeenCalled();
  });

  it("still answers 204 when the insert fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    insert.mockResolvedValue({ error: { code: "23514" } });
    await expectEmpty204(await post({ token: "test-demo-xyz", kind: "view" }));
    insert.mockRejectedValue(new Error("network"));
    await expectEmpty204(await post({ token: "test-demo-xyz", kind: "view" }));
  });
});
