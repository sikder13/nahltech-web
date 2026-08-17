import { contactDetails, siteUrl } from "@/lib/routes";

/**
 * RFC 9116 security.txt.
 *
 * A route rather than a static file in `public/` for one reason: `Expires` is
 * mandatory and the RFC says a file more than a year out of date should be
 * treated as stale. A static file would need someone to remember; this
 * recomputes on every build, so the deploy that ships anything else also
 * refreshes this.
 *
 * `force-static` keeps it a build-time artifact rather than a function
 * invocation per request — the expiry only needs to be right as of the last
 * deploy, and this site deploys often.
 */
export const dynamic = "force-static";

/** One year from the build, to the second, in the Zulu form the RFC wants. */
function expiresAt(): string {
  const expiry = new Date();
  expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);
  return expiry.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function GET(): Response {
  const body = [
    `Contact: mailto:${contactDetails.email}`,
    "Preferred-Languages: en",
    `Expires: ${expiresAt()}`,
    `Canonical: ${new URL("/.well-known/security.txt", siteUrl).toString()}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
