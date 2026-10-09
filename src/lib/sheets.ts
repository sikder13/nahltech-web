import { readFileSync } from "node:fs";
import path from "node:path";

import { z } from "zod";

/**
 * Reference sheets: the one-page PDFs enclosed with a letter and kept
 * current afterwards.
 *
 * One registry, three places that read it: the section on a provider's page,
 * that provider's own permanent address (`/<slug>/sheets`), and the public
 * library at `/sheets`. All three link the same file under `public/sheets/`,
 * so updating a sheet is one new file and one edit here. A file is named for
 * the month it was issued and is never overwritten: when a sheet changes,
 * the old file moves to `previous` and stays linked.
 */

const text = z.string().min(1);
const pdf = z.string().regex(/^\/sheets\/[a-z0-9-]+-\d{4}-\d{2}\.pdf$/);

const sheetSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  group: text,
  title: text,
  line: text,
  /** Served from `public/`, with the issue month in its name. */
  file: pdf,
  /** The first page, as a picture for the card. */
  thumb: z.string().regex(/^\/sheets\/thumbs\/[a-z0-9-]+\.webp$/),
  pages: z.number().int().positive(),
  /** As printed on the sheet: a month and a year. */
  updated: text,
  previous: z.array(z.strictObject({ file: pdf, updated: text })),
});

const registrySchema = z
  .strictObject({
    groups: z.array(z.strictObject({ id: text, title: text })).min(1),
    sheets: z.array(sheetSchema).min(1),
  })
  .superRefine((registry, ctx) => {
    const groups = new Set(registry.groups.map((group) => group.id));
    const seen = new Set<string>();
    for (const [index, sheet] of registry.sheets.entries()) {
      if (!groups.has(sheet.group)) {
        ctx.addIssue({
          code: "custom",
          path: ["sheets", index, "group"],
          message: `"${sheet.group}" is not a group`,
        });
      }
      if (seen.has(sheet.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["sheets", index, "id"],
          message: `"${sheet.id}" is listed twice`,
        });
      }
      seen.add(sheet.id);
    }
  });

export type Sheet = z.infer<typeof sheetSchema>;
export type SheetGroup = { id: string; title: string; sheets: Sheet[] };

let cache: z.infer<typeof registrySchema> | null = null;

function registry() {
  if (cache) return cache;
  const raw: unknown = JSON.parse(
    readFileSync(path.join(process.cwd(), "content", "sheets.json"), "utf8"),
  );
  const parsed = registrySchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `content/sheets.json is invalid: ${parsed.error.issues
        .map((i) => `${i.path.join(".")} ${i.message}`)
        .join("; ")}`,
    );
  }
  cache = parsed.data;
  return cache;
}

export function allSheets(): Sheet[] {
  return registry().sheets;
}

export function sheetById(id: string): Sheet | undefined {
  return registry().sheets.find((sheet) => sheet.id === id);
}

/** Every group that has a sheet in it, in the order the registry lists them. */
export function sheetGroups(): SheetGroup[] {
  const { groups, sheets } = registry();
  return groups
    .map((group) => ({
      ...group,
      sheets: sheets.filter((sheet) => sheet.group === group.id),
    }))
    .filter((group) => group.sheets.length > 0);
}
