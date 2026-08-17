import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getTeamPhoto, teamPhotos } from "./team-photos";

import en from "@/lib/i18n/dictionaries/en.json";

/**
 * The founder's constraint, as a test.
 *
 * These are two people's faces, published small, beside their names, on one
 * page. "Nowhere else" is the requirement, and a requirement nobody checks is
 * a requirement that lasts until the next person adds an OG image.
 */

const ROOT = process.cwd();
const PUBLIC_TEAM = path.join(ROOT, "public/images/team");

/** Every source file that could put an image somewhere. */
function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, found);
    else if (/\.(ts|tsx)$/.test(entry.name)) found.push(full);
  }
  return found;
}

describe("team photos", () => {
  it("ships both files, at both densities", () => {
    for (const photo of Object.values(teamPhotos)) {
      for (const asset of [photo.src, photo.src2x]) {
        const file = path.join(ROOT, "public", asset);
        expect(existsSync(file), asset).toBe(true);
      }
    }
  });

  it("keeps every avatar small enough to be free", () => {
    // They are 56px on screen. Anything heavy here means the crop or the
    // encode went wrong, and the page pays for it on every visit.
    for (const file of readdirSync(PUBLIC_TEAM)) {
      const kb = statSync(path.join(PUBLIC_TEAM, file)).size / 1024;
      expect(kb, `${file} is ${kb.toFixed(1)} kB`).toBeLessThan(30);
    }
  });

  it("names only people the about page publishes", () => {
    // A photo keyed to a name nobody renders is a face with no owner.
    const published = new Set(en.about.team.map((member) => member.name));
    for (const name of Object.keys(teamPhotos)) {
      expect(published.has(name), name).toBe(true);
    }
  });

  it("gives every photographed person the alt text to go with it", () => {
    for (const member of en.about.team) {
      if (!getTeamPhoto(member.name)) continue;
      expect(member.photoAlt, member.name).toBeTruthy();
      // Alt text that repeats the name and title is what a screen reader
      // needs here; the visible text beside it says the same thing, and the
      // image is the only part that otherwise says nothing.
      expect(member.photoAlt).toContain(member.name);
      expect(member.photoAlt).toContain(member.role);
    }
  });

  it("uses no middle name for Mohieminul, anywhere in the dictionary", () => {
    // Explicit founder instruction, and the kind of thing that creeps back in
    // from an older draft.
    expect(JSON.stringify(en)).not.toContain("Mohieminul Islam");
  });

  it("appears on the about page and nowhere else in the codebase", () => {
    // The whole point of the constraint. Schema logos, OG images and any
    // future avatar reuse all fail here first.
    const allowed = new Set([
      path.join(ROOT, "src/lib/team-photos.ts"),
      path.join(ROOT, "src/lib/team-photos.test.ts"),
    ]);

    const offenders = sourceFiles(path.join(ROOT, "src")).filter(
      (file) =>
        !allowed.has(file) && /images\/team\//.test(readFileSync(file, "utf8")),
    );

    expect(
      offenders.map((file) => path.relative(ROOT, file)),
      "team photos referenced outside the registry",
    ).toEqual([]);
  });

  it("is not referenced by any structured data", () => {
    // schema.org `logo`, `image` and `photo` would republish a face into
    // search results and AI answers, which is not what was agreed.
    const schema = readFileSync(
      path.join(ROOT, "src/lib/schema-org.ts"),
      "utf8",
    );
    expect(schema).not.toContain("images/team");
    expect(schema).not.toContain("udaay-sikder.webp");
    expect(schema).not.toContain("mohieminul-khan.webp");
  });
});
