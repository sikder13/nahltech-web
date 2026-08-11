import "server-only";

import { waitUntil } from "@vercel/functions";

/**
 * Run follow-up work that must finish, but must not delay the response.
 *
 * On Vercel a serverless function can be frozen the moment it responds, so an
 * un-awaited promise is not guaranteed to run — a lead alert started that way
 * can vanish silently, which is exactly the failure hard rule 6 exists to
 * prevent. `waitUntil` keeps the invocation alive until the work settles.
 *
 * Off Vercel (local `next start`, CI, tests) there is no such hook, so the
 * work is awaited instead. That costs the caller a few hundred milliseconds
 * and guarantees delivery, which is the right trade for an alert.
 */
export async function deliverAfterResponse(work: Promise<void>): Promise<void> {
  const guarded = work.catch((error: unknown) => {
    console.error("[after-response] background work failed", error);
  });

  if (process.env.VERCEL) {
    waitUntil(guarded);
    return;
  }

  await guarded;
}
