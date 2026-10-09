import { existsSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";
import { allAuditPages } from "@/lib/letter-pages/registry";
import { routes } from "@/lib/routes";

import { allSheets, sheetById, sheetGroups } from "./sheets";

const inPublic = (file: string) => path.join(process.cwd(), "public", file);

describe("reference sheets", () => {
  const sheets = allSheets();

  it("lists the four sheets of this wave, in two groups", () => {
    expect(
      sheetGroups().map((group) => [
        group.title,
        group.sheets.map((sheet) => sheet.id),
      ]),
    ).toEqual([
      [
        "Home care billing",
        ["evv-denial-decoder", "indiana-medicaid-payer-reference"],
      ],
      [
        "Residential providers",
        [
          "indiana-residential-provider-calendar",
          "substitute-dsp-shift-checklist",
        ],
      ],
    ]);
    expect(sheets).toHaveLength(4);
  });

  it("ships every file it links, each under 2 MB", () => {
    for (const sheet of sheets) {
      for (const file of [sheet.file, ...sheet.previous.map((v) => v.file)]) {
        expect(existsSync(inPublic(file)), file).toBe(true);
        expect(statSync(inPublic(file)).size, file).toBeLessThan(
          2 * 1024 * 1024,
        );
      }
      expect(existsSync(inPublic(sheet.thumb)), sheet.thumb).toBe(true);
    }
  });

  it("names each file for the month it was issued", () => {
    for (const sheet of sheets) {
      expect(sheet.file).toMatch(/-\d{4}-\d{2}\.pdf$/);
    }
    expect(sheetById("evv-denial-decoder")?.file).toBe(
      "/sheets/evv-denial-decoder-2026-10.pdf",
    );
    expect(sheetById("indiana-medicaid-payer-reference")?.file).toBe(
      "/sheets/indiana-medicaid-payer-reference-2026-10.pdf",
    );
  });

  it("gives a provider's page and the library the same files", () => {
    // One registry, so the three places a sheet appears cannot drift: a
    // provider's cards resolve through it to the files the library lists.
    const library = new Set(
      sheetGroups().flatMap((g) => g.sheets.map((s) => s.file)),
    );
    for (const page of allAuditPages()) {
      for (const card of page.sheets.cards) {
        const sheet = sheetById(card.sheet)!;
        expect(library.has(sheet.file), card.sheet).toBe(true);
        // The page's own wording for the sheet matches the registry's.
        expect(card.title).toBe(sheet.title);
        expect(card.line).toBe(sheet.line);
      }
    }
  });

  it("puts the public library in the sitemap", () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);
    expect(routes.sheets).toBe("/sheets");
    expect(paths).toContain("/sheets");
  });
});
