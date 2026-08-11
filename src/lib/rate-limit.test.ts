import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const limitMock = vi.fn();

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: () => ({ __redis: true }) },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow(limit: number, window: string) {
      return { limit, window };
    }
    limit = limitMock;
  },
}));

const ENV_URL = "UPSTASH_REDIS_REST_URL";
const ENV_TOKEN = "UPSTASH_REDIS_REST_TOKEN";

async function loadModule() {
  const loaded = await import("./rate-limit");
  loaded.resetRateLimitStateForTests();
  return loaded;
}

describe("clientIpFrom", () => {
  it("takes the first entry of x-forwarded-for", async () => {
    const { clientIpFrom } = await loadModule();
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.9, 70.41.3.18, 150.172.238.178",
      "x-real-ip": "10.0.0.1",
    });
    // The client is first; everything after it is an intermediary that could
    // otherwise be used to share one bucket across unrelated visitors.
    expect(clientIpFrom(headers)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip, then to a constant", async () => {
    const { clientIpFrom } = await loadModule();
    expect(clientIpFrom(new Headers({ "x-real-ip": "10.0.0.1" }))).toBe(
      "10.0.0.1",
    );
    expect(clientIpFrom(new Headers())).toBe("unknown");
  });
});

describe("checkLimit", () => {
  beforeEach(() => {
    limitMock.mockReset();
    vi.stubEnv(ENV_URL, "https://example.upstash.io");
    vi.stubEnv(ENV_TOKEN, "token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("fails open when the Upstash env vars are missing", async () => {
    vi.stubEnv(ENV_URL, "");
    vi.stubEnv(ENV_TOKEN, "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { checkLimit } = await loadModule();
    const result = await checkLimit("ip:203.0.113.9", { perMinute: 10 });

    expect(result).toEqual({ ok: true });
    expect(limitMock).not.toHaveBeenCalled();
    // One warning, not one per request.
    expect(warn).toHaveBeenCalledTimes(1);
    await checkLimit("ip:203.0.113.9", { perMinute: 10 });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("fails open when Redis throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    limitMock.mockRejectedValue(new Error("upstash unreachable"));

    const { checkLimit } = await loadModule();

    // Availability beats strictness on the lead path: a Redis outage must not
    // turn away a real enquiry.
    await expect(checkLimit("ip:1.1.1.1", { perMinute: 10 })).resolves.toEqual({
      ok: true,
    });
  });

  it("blocks once the window is exhausted and reports a retry delay", async () => {
    limitMock.mockResolvedValue({
      success: false,
      reset: Date.now() + 42_000,
    });

    const { checkLimit } = await loadModule();
    const result = await checkLimit("ip:1.1.1.1", { perMinute: 10 });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected the limit to be refused");
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(42);
  });

  it("requires every configured window to pass", async () => {
    limitMock
      .mockResolvedValueOnce({ success: true, reset: 0 })
      .mockResolvedValueOnce({ success: false, reset: Date.now() + 3_600_000 });

    const { checkLimit } = await loadModule();
    const result = await checkLimit("ip:1.1.1.1", {
      perMinute: 10,
      perDay: 100,
    });

    // The minute window passed, the day window did not.
    expect(limitMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(false);
  });

  it("allows the request when no window is configured", async () => {
    const { checkLimit } = await loadModule();
    await expect(checkLimit("ip:1.1.1.1", {})).resolves.toEqual({ ok: true });
    expect(limitMock).not.toHaveBeenCalled();
  });
});
