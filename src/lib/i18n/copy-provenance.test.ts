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

/**
 * The regions the identity phrase claims, as of the 3 September 2026
 * expansion. Written out rather than parsed out of the sentence: the point of
 * the constant is to be an independent copy, so that editing the descriptor
 * and editing what it is checked against are two deliberate acts.
 *
 * "the Gulf" rather than "the Gulf region" because the short form shortens it
 * and the long form does not; this is the half both of them share.
 */
const SERVED_REGIONS = [
  "Indianapolis",
  "North America",
  "the Gulf",
  "Central Asia",
  "New Zealand",
] as const;

describe("the canonical short descriptor", () => {
  // COPY-PACK-1 §2 is one string with three jobs: the home meta description,
  // the About meta description, and the Organization node's `description`.
  // They are the same claim about the same company, so they are the same
  // characters — a search engine that reads two of them and finds them
  // different has been told the company is two things.
  it("is character-identical across the three surfaces that carry it", () => {
    expect(en.pages.home.description).toBe(en.site.description);
    expect(en.pages.about.description).toBe(en.site.description);
  });

  it("leads with the consulting business, not the products", () => {
    // The reason this pack exists: the machine-readable identity described a
    // social-impact product startup and steered a prospect away from hiring
    // the firm as a consultancy. Whatever else the sentence says, it opens on
    // what the company sells.
    expect(en.site.description).toMatch(/^AI consulting and implementation/);
  });

  it("names the served regions the descriptor names", () => {
    for (const region of SERVED_REGIONS) {
      expect(en.site.description, region).toContain(region);
    }
  });

  it("names the same regions as the long descriptor on /about", () => {
    // The identity phrase exists in two lengths — the short form on the three
    // meta surfaces, the long form in the /about lead and in llms.txt — and
    // an expansion that reaches one and not the other is how the site starts
    // telling two stories about where it sells. The wording differs by
    // design ("the Gulf" against "the Gulf region"); the regions may not.
    for (const region of SERVED_REGIONS) {
      expect(en.about.intro, region).toContain(region);
    }
  });

  it("carries no About-page prefix, because the prefixed form is too long", () => {
    // The pack made "About Nahl Technologies: " conditional on the result
    // staying at or under 165 characters. It comes to 188, so the pack's own
    // rule selects the unmodified form. Pinned so a later edit that adds the
    // prefix has to confront the length rather than silently exceed it.
    const prefixed = `About Nahl Technologies: ${en.site.description}`;
    expect(prefixed.length).toBeGreaterThan(165);
    expect(en.pages.about.description.startsWith("About")).toBe(false);
  });
});

describe("the served territory is stated one way", () => {
  /** Every string value in the dictionary, unescaped. */
  const strings = [...JSON.stringify(en).matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(
    (match) => match[1].replaceAll("\\u2014", "—"),
  );

  it("names all four regions wherever it lists the footprint", () => {
    // A sentence that names two of the four regions together is listing where
    // the firm sells, not naming one market — the Gulf page's own metadata
    // says "the wider Gulf" and nothing else, and is rightly not caught here.
    // Once it is a list, it has to be the whole list: this is the assertion
    // that stopped two sentences drifting a region behind the descriptor on
    // 3 September, one of them into FAQPage markup.
    const footprint = strings.filter(
      (value) => value.includes("Central Asia") && value.includes("Gulf"),
    );
    expect(footprint.length).toBeGreaterThan(0);

    for (const value of footprint) {
      for (const region of SERVED_REGIONS.filter(
        (name) => name !== "Indianapolis",
      )) {
        expect(value, `"${value.slice(0, 56)}…" omits ${region}`).toContain(
          region,
        );
      }
    }
  });

  it("carries none of the superseded territory phrasings", () => {
    // The phrase is frozen, and these are the three forms it has already
    // moved through. Any of them reappearing means an edit reached for an old
    // sentence — from a draft, a cached copy, or memory.
    for (const stale of [
      "the United States, Canada, and the Gulf region",
      "the US, Canada, and the Gulf region",
      "North America, the Gulf region, and Central Asia",
    ]) {
      expect(strings.filter((value) => value.includes(stale))).toEqual([]);
    }
  });
});

describe("the canonical descriptor on /about", () => {
  it("opens by naming the firm and what it does", () => {
    expect(en.about.intro).toMatch(
      /^Nahl Technologies is an AI consulting and implementation firm/,
    );
  });

  it("is one paragraph, not an array of them", () => {
    // PageHeader accepts either. This one is a single supplied paragraph and
    // splitting it across two would be an edit to approved copy.
    expect(typeof en.about.intro).toBe("string");
    expect(en.about.intro).not.toContain("\n");
  });
});
