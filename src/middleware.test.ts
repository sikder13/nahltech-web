import { readFileSync } from "node:fs";
import path from "node:path";

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

  it("allows gtag.js to load when analytics is configured", () => {
    // Without this the script is blocked by default-src and GA reports
    // nothing, while the dataLayer keeps accepting pushes — so every event
    // still looks like it fired. Verified against a real browser in CC-8.
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-KMEM2DS98H");

    const csp = middleware(request("/")).headers.get("Content-Security-Policy");

    expect(csp).toMatch(/script-src[^;]*https:\/\/\*\.googletagmanager\.com/);
    expect(csp).toMatch(/connect-src[^;]*https:\/\/\*\.google-analytics\.com/);
    expect(csp).toMatch(/img-src[^;]*https:\/\/\*\.google-analytics\.com/);
    vi.unstubAllEnvs();
  });

  it("grants analytics nothing when no measurement ID is set", () => {
    // A preview or local build ships no analytics, so it gets no allowance.
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");

    const csp = middleware(request("/")).headers.get("Content-Security-Policy");

    expect(csp).not.toContain("googletagmanager.com");
    expect(csp).not.toContain("google-analytics.com");
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

describe("HSTS", () => {
  it("does not claim preload readiness before cutover", async () => {
    // `preload` declares the apex and every subdomain HTTPS-only forever, and
    // removal from the list takes months. www.nahltech.com does not resolve
    // over TLS today, so the claim would be false. Add it after cutover.
    const csp = middleware(request("/")).headers.get(
      "Strict-Transport-Security",
    );
    // Dev builds send no HSTS at all; only assert the shape when present.
    if (csp !== null) {
      expect(csp).not.toContain("preload");
      expect(csp).toContain("includeSubDomains");
    }
  });

  it("uses the same value next.config sets for static assets", async () => {
    // Two layers set this: the middleware for pages and API routes, and
    // next.config for `_next/static`, which the matcher excludes. Two
    // different max-ages would be a confusing thing to debug at 2am.
    const config = await import("../next.config");
    const source = readFileSync(
      path.join(process.cwd(), "next.config.ts"),
      "utf8",
    );
    const fromConfig = source.match(
      /value: "(max-age=\d+; includeSubDomains[^"]*)"/,
    )?.[1];
    const fromMiddleware = readFileSync(
      path.join(process.cwd(), "src/middleware.ts"),
      "utf8",
    ).match(/"(max-age=\d+; includeSubDomains[^"]*)"/)?.[1];

    expect(config).toBeDefined();
    expect(fromConfig).toBeDefined();
    expect(fromMiddleware).toBe(fromConfig);
  });
});
