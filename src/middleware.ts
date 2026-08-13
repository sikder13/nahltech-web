import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/lib/i18n/config";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Origin of the Supabase project, for `connect-src`.
 *
 * The chat widget inserts conversation and message rows straight from the
 * browser with the anon key, which is a cross-origin request to
 * `https://<ref>.supabase.co`. Without this the CSP blocks every one of them
 * and chat logging silently stops working. /api/chat itself is same-origin
 * and needs no entry.
 *
 * Parsed rather than interpolated so a malformed env var cannot inject extra
 * directives, and so an unset one (CI builds have no Supabase credentials)
 * degrades to omitting the origin rather than emitting `undefined`.
 */
function supabaseOrigin(): string[] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    return [new URL(raw).origin];
  } catch {
    return [];
  }
}

/**
 * Content Security Policy.
 *
 * Deliberately nonce-free. A nonce has to be minted per request, which opts
 * every page out of static rendering — and ARCH-1 §7 makes static rendering a
 * hard requirement (LCP < 2.0s, all marketing pages SSG). The cost is
 * `'unsafe-inline'` on script-src, because the App Router streams hydration
 * data through inline <script> tags that would otherwise be blocked.
 *
 * Everything else is locked down: no framing, no plugins, no arbitrary
 * origins, and `'unsafe-eval'` only in dev, where React Refresh needs it.
 */

/**
 * Whether to allow the Google Analytics origins.
 *
 * Gated on the measurement ID so a build without analytics carries no
 * allowance for it. Getting this wrong is completely silent: gtag.js is
 * blocked outright while the dataLayer keeps accepting pushes, so every event
 * looks like it fired and GA receives nothing.
 */
function analyticsEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
}

function contentSecurityPolicy(): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "https://va.vercel-scripts.com",
      ...(analyticsEnabled() ? ["https://*.googletagmanager.com"] : []),
      ...(isProduction ? [] : ["'unsafe-eval'"]),
    ],
    // Tailwind ships a stylesheet, but Next still inlines critical CSS.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      // gtag falls back to pixel transport when sendBeacon is unavailable.
      ...(analyticsEnabled()
        ? ["https://*.google-analytics.com", "https://*.googletagmanager.com"]
        : []),
    ],
    // next/font self-hosts, so no external font origin is needed.
    "font-src": ["'self'"],
    "connect-src": [
      "'self'",
      "https://va.vercel-scripts.com",
      "https://vitals.vercel-insights.com",
      // Anon chat logging posts directly to the Supabase REST endpoint.
      ...supabaseOrigin(),
      ...(analyticsEnabled()
        ? [
            "https://*.google-analytics.com",
            "https://*.analytics.google.com",
            "https://*.googletagmanager.com",
          ]
        : []),
      // Dev server hot reload runs over a websocket.
      ...(isProduction ? [] : ["ws:"]),
    ],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
  };

  if (isProduction) {
    directives["upgrade-insecure-requests"] = [];
  }

  return Object.entries(directives)
    .map(([name, values]) =>
      values.length > 0 ? `${name} ${values.join(" ")}` : name,
    )
    .join("; ");
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("Content-Security-Policy", contentSecurityPolicy());
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );

  // Only over TLS. Sending HSTS from a plain-HTTP dev server can pin
  // localhost to HTTPS in the browser and break unrelated local work.
  if (isProduction) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1] ?? "";

  /**
   * API routes are not localized.
   *
   * They stay in the matcher so their responses still carry the security
   * headers, but they must never be rewritten under a locale segment: there
   * is no /en/api/* route, so the rewrite turns every API call into a 500.
   */
  if (firstSegment === "api") {
    return withSecurityHeaders(NextResponse.next());
  }

  // English ships unprefixed, so /en/* is not a canonical URL. Redirect it
  // rather than serving the same page at two addresses.
  if (firstSegment === defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(defaultLocale.length + 1) || "/";
    return withSecurityHeaders(NextResponse.redirect(url, 308));
  }

  // Other configured locales pass straight through to the [locale] segment,
  // where the live-locale guard turns them into a 404.
  if (isLocale(firstSegment)) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Everything else is English. Rewrite under /en internally; the browser
  // keeps the unprefixed URL.
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return withSecurityHeaders(NextResponse.rewrite(url));
}

export const config = {
  matcher: [
    /**
     * Everything except Next internals, files with an extension, and the
     * metadata file-convention routes. Those last ones matter: they have no
     * extension, so without an explicit exclusion they would be rewritten
     * under /en and 404 — taking the Open Graph image and favicon with them.
     */
    "/((?!_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|icon|apple-icon|manifest|.*\\..*).*)",
  ],
};
