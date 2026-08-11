import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import en from "./dictionaries/en.json";

/**
 * Keeps the COPY PROVENANCE block in get-dictionary.ts honest.
 *
 * Hard rule 12 makes copy authorship tracked, and the failure mode of a
 * hand-maintained audit trail is silent rot: a key gets renamed and the block
 * still names the old one, or a string is added and nobody records who wrote
 * it. Both leave a trail that reads as complete while being wrong, which is
 * worse than having no trail at all.
 *
 * This reads the block as text rather than duplicating its contents, so the
 * comment stays the single source and the test cannot drift from it.
 */

// Resolved from the project root: the jsdom environment gives `import.meta.url`
// an http: scheme, so fileURLToPath cannot be used here.
const source = readFileSync(
  path.join(process.cwd(), "src/lib/i18n/get-dictionary.ts"),
  "utf8",
);

const start = source.indexOf("COPY PROVENANCE");
const block = source.slice(start, source.indexOf("*/", start));

/**
 * Only keys under the sections the block actually enumerates. Matching bare
 * dotted words would also pick up `en.json` and `get-dictionary.ts`.
 */
function listedKeys(): string[] {
  const found = block.match(/\b(?:leadForm|chat|newsletter)\.[a-zA-Z]+\b/g);
  return [...new Set(found ?? [])];
}

function resolve(key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      en,
    );
}

describe("copy provenance block", () => {
  it("is present and parses", () => {
    expect(start).toBeGreaterThan(-1);
    expect(listedKeys().length).toBeGreaterThan(0);
  });

  it("names only keys that still exist in the dictionary", () => {
    // Catches a rename or deletion that left the trail pointing at nothing.
    const missing = listedKeys().filter(
      (key) => typeof resolve(key) !== "string",
    );
    expect(
      missing,
      `Listed in the provenance block but gone from en.json: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("accounts for every chat string", () => {
    // chat.* is wholly session-authored, so the block must name all of it.
    // A new key added without a line here is unattributed copy.
    const listed = new Set(listedKeys());
    const unlisted = Object.keys(en.chat)
      .map((key) => `chat.${key}`)
      .filter((key) => !listed.has(key));
    expect(
      unlisted,
      `Add these to the provenance block in get-dictionary.ts: ${unlisted.join(", ")}`,
    ).toEqual([]);
  });

  it("accounts for every newsletter string", () => {
    // Wholly founder-supplied, and recorded as such — same completeness rule.
    const listed = new Set(listedKeys());
    const unlisted = Object.keys(en.newsletter)
      .map((key) => `newsletter.${key}`)
      .filter((key) => !listed.has(key));
    expect(
      unlisted,
      `Add these to the provenance block in get-dictionary.ts: ${unlisted.join(", ")}`,
    ).toEqual([]);
  });

  it("states the right number of remaining placeholders", () => {
    // When the legal copy lands this fails, which is the point: the block has
    // to be updated in the same change rather than quietly going stale.
    const claimed = block.match(/(\d+) `\[PLACEHOLDER/);
    expect(
      claimed,
      "The block no longer states a placeholder count",
    ).not.toBeNull();

    const actual = (JSON.stringify(en).match(/\[PLACEHOLDER/g) ?? []).length;
    expect(
      Number(claimed![1]),
      `Block says ${claimed![1]} placeholders, en.json has ${actual}`,
    ).toBe(actual);
  });

  it("does not claim founder copy was written in a build session", () => {
    // The two chat strings quoted from the Phase 4 brief must stay called out
    // as the founder's wording, not silently absorbed into the authored list.
    expect(block).toContain("chat.fallback");
    expect(block).toContain("chat.consentButton");
    expect(block).toMatch(/founder's own wording/);
  });
});
