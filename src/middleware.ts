import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/lib/i18n/config";

const isProduction = process.env.NODE_ENV === "production";

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
function contentSecurityPolicy(): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "https://va.vercel-scripts.com",
      ...(isProduction ? [] : ["'unsafe-eval'"]),
    ],
    // Tailwind ships a stylesheet, but Next still inlines critical CSS.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    // next/font self-hosts, so no external font origin is needed.
    "font-src": ["'self'"],
    "connect-src": [
      "'self'",
      "https://va.vercel-scripts.com",
      "https://vitals.vercel-insights.com",
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
    // Everything except Next internals and files with an extension.
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
