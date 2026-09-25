import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  dashboardSchema,
  sharedSchema,
  type DashboardConfig,
  type SharedCopy,
} from "./schema";

/**
 * TEMPLATE 2 · loads prospect dashboards from `content/dashboards-v2/`,
 * served at `/m2/<token>`.
 *
 * Template 1 (`content/dashboards/`, `/m/<token>`, `src/lib/dashboards/*.ts`)
 * is frozen exactly as it shipped with the EckCo letter and is never edited;
 * every page built since lives here. Pages already sent to a prospect are
 * left as they are; new features apply only to new pages.
 *
 * One JSON file per company; `_shared.json` holds the chrome every page
 * carries. Files starting with an underscore are never treated as a
 * company. A config that fails the schema fails the build, with the file
 * name in the error, rather than shipping a half-rendered page to a
 * prospect who was mailed its address.
 *
 * Deliberately free of `server-only`: `next.config.ts` imports this to
 * generate the friendly-slug redirects, and that runs in plain Node where
 * the `server-only` guard would throw. Nothing here is secret; the configs
 * are content, the same as the MDX in `content/research/`.
 */

const DIR = path.join(process.cwd(), "content", "dashboards-v2");

let cache: DashboardConfig[] | null = null;

export function allDashboards(): DashboardConfig[] {
  if (cache) return cache;
  const files = readdirSync(DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .sort();
  const loaded = files.map((file) => {
    const raw: unknown = JSON.parse(readFileSync(path.join(DIR, file), "utf8"));
    const parsed = dashboardSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `content/dashboards-v2/${file} is invalid: ${parsed.error.issues
          .map((i) => `${i.path.join(".")} ${i.message}`)
          .join("; ")}`,
      );
    }
    return parsed.data;
  });
  cache = loaded;
  return loaded;
}

export function dashboardByToken(token: string): DashboardConfig | undefined {
  return allDashboards().find((d) => d.token === token);
}

export function isKnownToken(token: string): boolean {
  return allDashboards().some((d) => d.token === token);
}

export function sharedCopy(): SharedCopy {
  const raw: unknown = JSON.parse(
    readFileSync(path.join(DIR, "_shared.json"), "utf8"),
  );
  return sharedSchema.parse(raw);
}

/**
 * `/mursix` → `/m2/<token>`. Next.js matches redirect paths without regard to
 * case, so `/Mursix` and `/MURSIX` arrive here too. Temporary (307), never
 * permanent: the letter prints the short address, and the token scheme
 * behind it must stay free to change without browsers having cached the old
 * target forever.
 */
export function dashboardRedirects() {
  return allDashboards().map((d) => ({
    source: `/${d.slug}`,
    destination: `/m2/${d.token}`,
    permanent: false,
  }));
}
