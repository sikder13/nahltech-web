import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { serviceInterestByPage, serviceInterestFor } from "./service-interest";
import { serviceRouteKeys } from "./routes";
import { serviceInterests, leadSources } from "./supabase/types";

/**
 * The mapping from service page to database enum.
 *
 * A wrong value here does not throw anywhere obvious — /api/lead rejects the
 * whole submission on a zod enum miss, so the visible symptom is a lead that
 * silently fails to arrive. That is the exact failure hard rule 6 exists to
 * prevent, so the mapping is checked against the migrations rather than
 * against itself.
 */

const MIGRATIONS = path.join(process.cwd(), "supabase/migrations");

/** Enum members as the SQL actually declares them, across all migrations. */
function enumValuesFromSql(typeName: string): Set<string> {
  const values = new Set<string>();

  for (const file of readdirSync(MIGRATIONS).sort()) {
    const sql = readFileSync(path.join(MIGRATIONS, file), "utf8");

    const created = new RegExp(
      `create type ${typeName} as enum\\s*\\(([^)]*)\\)`,
      "i",
    ).exec(sql);
    if (created) {
      for (const match of created[1].matchAll(/'([a-z_]+)'/g)) {
        values.add(match[1]);
      }
    }

    const addPattern = new RegExp(
      `ALTER TYPE ${typeName} ADD VALUE(?: IF NOT EXISTS)? '([a-z_]+)'`,
      "gi",
    );
    for (const match of sql.matchAll(addPattern)) values.add(match[1]);
  }

  return values;
}

describe("service interest mapping", () => {
  it("covers all five service pages and nothing else", () => {
    expect(Object.keys(serviceInterestByPage).sort()).toEqual(
      [...serviceRouteKeys].sort(),
    );
  });

  it("maps each page to a value the database will accept", () => {
    const declared = enumValuesFromSql("service_interest");

    // Sanity-check the parser before trusting it: "0 mismatches" from a regex
    // that matched nothing proves nothing.
    expect(declared.size).toBeGreaterThan(5);

    for (const key of serviceRouteKeys) {
      const value = serviceInterestFor(key);
      expect(declared.has(value), `${key} -> ${value} not in SQL enum`).toBe(
        true,
      );
      expect(serviceInterests, `${key} -> ${value}`).toContain(value);
    }
  });

  it("gives every page a distinct value", () => {
    const values = serviceRouteKeys.map(serviceInterestFor);
    expect(new Set(values).size).toBe(values.length);
  });

  it("has service_page in lead_source, in SQL and in TypeScript", () => {
    // Added by 0004 for the forms these pages now carry. The TypeScript
    // constant and the migration are two separate hand-edits; this is what
    // stops them disagreeing.
    expect(enumValuesFromSql("lead_source").has("service_page")).toBe(true);
    expect(leadSources).toContain("service_page");
  });
});
