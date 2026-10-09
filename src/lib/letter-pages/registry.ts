import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { auditPageSchema, type AuditPageConfig } from "./audit-schema";
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
 * `next.config.ts` imports this to build the short-address redirects.
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

const AUDIT_DIR = path.join(process.cwd(), "content", "letter-audits");

let auditCache: AuditPageConfig[] | null = null;

/** Audit pages, from `content/letter-audits/`. Same rules, their own schema. */
export function allAuditPages(): AuditPageConfig[] {
  if (auditCache) return auditCache;
  const files = readdirSync(AUDIT_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .sort();
  const loaded = files.map((file) => {
    const raw: unknown = JSON.parse(
      readFileSync(path.join(AUDIT_DIR, file), "utf8"),
    );
    const parsed = auditPageSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `content/letter-audits/${file} is invalid: ${parsed.error.issues
          .map((i) => `${i.path.join(".")} ${i.message}`)
          .join("; ")}`,
      );
    }
    return parsed.data;
  });
  auditCache = loaded;
  return loaded;
}

export function auditPageByToken(token: string): AuditPageConfig | undefined {
  return allAuditPages().find((page) => page.token === token);
}

/** The prototype an audit page embeds, as the HTML it was delivered in. */
export function auditBoardHtml(slug: string): string {
  return readFileSync(path.join(AUDIT_DIR, `${slug}-board.html`), "utf8");
}

/**
 * What the visit count and the reply box need to know about a page of either
 * kind: which provider it is for, and the address its letter prints.
 */
export type LetterPageIdentity = {
  slug: string;
  token: string;
  company: { name: string };
};

export function letterIdentityByToken(
  token: string,
): LetterPageIdentity | undefined {
  return letterPageByToken(token) ?? auditPageByToken(token);
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
  const short = (slug: string, token: string, rest = "") => ({
    source: `/${slug}${rest}`,
    destination: `/m3/${token}${rest}`,
    permanent: false,
  });
  return [
    ...allLetterPages().map((page) => short(page.slug, page.token)),
    // An audit page also has its sheets, kept at their own address for good,
    // and the full-screen preview.
    ...allAuditPages().flatMap((page) => [
      short(page.slug, page.token),
      short(page.slug, page.token, "/sheets"),
      short(page.slug, page.token, "/preview"),
    ]),
  ];
}
