import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { middleware } from "./middleware";

function request(path: string) {
  return new NextRequest(new URL(path, "https://nahltech.com"));
}

describe("middleware routing", () => {
  it("leaves API routes alone", () => {
    // There is no /en/api/* route, so rewriting an API call under the locale
    // turns every one of them into a 500. This is the regression that took
    // all three Phase 4 routes down in local production.
    for (const path of ["/api/lead", "/api/chat", "/api/subscribe"]) {
      const response = middleware(request(path));
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
      expect(response.headers.get("location")).toBeNull();
    }
  });

  it("still puts the security headers on API responses", () => {
    const response = middleware(request("/api/lead"));

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "default-src 'self'",
    );
  });

  it("rewrites unprefixed paths under the default locale", () => {
    expect(
      middleware(request("/")).headers.get("x-middleware-rewrite"),
    ).toContain("/en");
    expect(
      middleware(request("/pricing")).headers.get("x-middleware-rewrite"),
    ).toContain("/en/pricing");
  });

  it("redirects /en/* to the canonical unprefixed URL", () => {
    const response = middleware(request("/en/pricing"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toContain("/pricing");
  });

  it("lets non-live locales through to the 404 guard", () => {
    // ar and bn are routable concepts with no content; the [locale] segment
    // turns them into a 404 rather than the middleware guessing.
    const response = middleware(request("/ar/pricing"));

    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.status).not.toBe(308);
  });

  it("allows the Supabase origin to be reached from the browser", () => {
    // The chat widget's anon inserts are cross-origin; without this entry the
    // CSP blocks every one of them.
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://posdwhozfmlofsvqfohn.supabase.co/rest/v1",
    );

    const csp = middleware(request("/")).headers.get("Content-Security-Policy");

    // Only the origin, not the path it was parsed out of.
    expect(csp).toMatch(
      /connect-src[^;]*https:\/\/posdwhozfmlofsvqfohn\.supabase\.co(?![/\w])/,
    );
    vi.unstubAllEnvs();
  });

  it("omits the Supabase origin rather than emitting a broken directive", () => {
    // CI builds have no Supabase credentials. An unset variable must drop the
    // entry, never interpolate `undefined` into the policy.
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    const csp = middleware(request("/")).headers.get("Content-Security-Policy");

    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain("undefined");
    vi.unstubAllEnvs();
  });
});
