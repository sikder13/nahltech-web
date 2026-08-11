import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Upstash sliding-window rate limiting for the public API routes
 * (hard rule 5, ARCH-1 §6).
 *
 * FAIL OPEN, deliberately. If Upstash is unreachable or unconfigured, the
 * request is allowed. On a lead form, availability beats strictness: dropping
 * a real enquiry because a rate-limit backend had a bad minute is a worse
 * outcome than serving an abusive one (ARCH-1 §6, hard rule 6). Every Redis
 * call is wrapped, and a failure is logged once rather than per request.
 */

export type LimitConfig = {
  perMinute?: number;
  perDay?: number;
};

export type LimitResult =
  { ok: true } | { ok: false; retryAfterSeconds: number };

const ALLOW: LimitResult = { ok: true };

/**
 * Pull the caller's IP out of the proxy headers.
 *
 * `x-forwarded-for` is a comma-separated chain and the client is the first
 * entry; everything after it is an intermediary. Falls back to `x-real-ip`,
 * then to a constant so a request with neither still gets limited as a group
 * rather than skipping the check entirely.
 */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

let redis: Redis | null = null;
let redisUnavailable = false;
let warned = false;

function warnOnce(message: string, error?: unknown) {
  if (warned) return;
  warned = true;
  console.warn(
    `[rate-limit] ${message} Requests will be allowed through.`,
    error ?? "",
  );
}

function getRedis(): Redis | null {
  if (redis) return redis;
  if (redisUnavailable) return null;

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redisUnavailable = true;
    warnOnce("Upstash env vars are not set.");
    return null;
  }

  try {
    redis = Redis.fromEnv();
    return redis;
  } catch (error) {
    redisUnavailable = true;
    warnOnce("Could not construct the Upstash client.", error);
    return null;
  }
}

// One Ratelimit instance per window, reused across requests. Building these
// per call would leak the ephemeral-cache benefit and add allocation to every
// request on the hot path.
const limiters = new Map<string, Ratelimit>();

function getLimiter(
  client: Redis,
  window: "minute" | "day",
  limit: number,
): Ratelimit {
  const cacheKey = `${window}:${limit}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;

  const created = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(
      limit,
      window === "minute" ? "60 s" : "86400 s",
    ),
    prefix: `nahltech:${window}`,
    analytics: false,
  });
  limiters.set(cacheKey, created);
  return created;
}

/**
 * Check `key` against the supplied windows. Both must pass; the first refusal
 * wins and reports how long to wait.
 */
export async function checkLimit(
  key: string,
  config: LimitConfig,
): Promise<LimitResult> {
  const client = getRedis();
  if (!client) return ALLOW;

  const windows: Array<["minute" | "day", number]> = [];
  if (config.perMinute) windows.push(["minute", config.perMinute]);
  if (config.perDay) windows.push(["day", config.perDay]);
  if (windows.length === 0) return ALLOW;

  for (const [window, limit] of windows) {
    try {
      const { success, reset } = await getLimiter(client, window, limit).limit(
        key,
      );
      if (!success) {
        const seconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        return { ok: false, retryAfterSeconds: seconds };
      }
    } catch (error) {
      warnOnce(`The ${window} window check failed.`, error);
      return ALLOW;
    }
  }

  return ALLOW;
}

/** Test seam: resets the memoised client, limiters and one-shot warning. */
export function resetRateLimitStateForTests() {
  redis = null;
  redisUnavailable = false;
  warned = false;
  limiters.clear();
}
