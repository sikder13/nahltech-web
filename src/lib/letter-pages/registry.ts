import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  letterPageSchema,
  letterSharedSchema,
  type LetterPageConfig,
  type LetterSharedCopy,
} from "./schema";

/**
 * Loads letter pages from `content/letter-pages/`, served at `/m3/<token>`.
 *
 * A copy of the template 2 loader rather than a shared one, so that the
 * dashboards already sent to a prospect are never edited to make room for
 * these. One JSON file per provider; `_shared.json` holds the contact block
 * and the closing line every page carries. A config that fails the schema
 * fails the build with the file name in the error.
 *
 * Free of `server-only` for the same reason the dashboard loaders are:
 * `next.config.ts` imports this to generate the short-address redirects.
 */

const DIR = path.join(process.cwd(), "content", "letter-pages");

let cache: LetterPageConfig[] | null = null;

export function allLetterPages(): LetterPageConfig[] {
  if (cache) return cache;
  const files = readdirSync(DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .sort();
  const loaded = files.map((file) => {
    const raw: unknown = JSON.parse(readFileSync(path.join(DIR, file), "utf8"));
    const parsed = letterPageSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `content/letter-pages/${file} is invalid: ${parsed.error.issues
          .map((i) => `${i.path.join(".")} ${i.message}`)
          .join("; ")}`,
      );
    }
    return parsed.data;
  });
  cache = loaded;
  return loaded;
}

export function letterPageByToken(token: string): LetterPageConfig | undefined {
  return allLetterPages().find((page) => page.token === token);
}

export function letterSharedCopy(): LetterSharedCopy {
  const raw: unknown = JSON.parse(
    readFileSync(path.join(DIR, "_shared.json"), "utf8"),
  );
  return letterSharedSchema.parse(raw);
}

/**
 * `/quinton` → `/m3/<token>`. Temporary (307), never permanent, for the same
 * reason as the dashboards: the letter prints the short address, and the
 * address behind it must stay free to change.
 */
export function letterPageRedirects() {
  return allLetterPages().map((page) => ({
    source: `/${page.slug}`,
    destination: `/m3/${page.token}`,
    permanent: false,
  }));
}
