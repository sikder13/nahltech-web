/**
 * The team photographs, keyed by the name the about page publishes.
 *
 * Asset paths rather than copy, which is why they are here and not in the
 * dictionary: a locale changes the alt text, never which face belongs to
 * which person. The alt text itself lives in `about.team[].photoAlt`.
 *
 * Membership is the switch. A person with an entry gets their photograph; a
 * person without one keeps the neutral glyph, which is the state the page
 * shipped in and the correct state for anyone who has not given us a photo.
 * Nobody is ever rendered with someone else's face or a stock one.
 *
 * These images appear here and nowhere else on the site — not in the
 * Organization logo, not in an OG image, not in any structured data. That is a
 * deliberate limit on where two people's faces travel, and it is asserted by
 * `team-photos.test.ts` rather than left as an intention.
 *
 * Both files are derived by `scripts/build-team-avatars.mjs` from originals
 * that are not in the repo.
 */

export type TeamPhoto = {
  /** 160x160, the 1x asset for a 56–64px render. */
  src: string;
  /** 320x320, the same crop for retina. */
  src2x: string;
};

export const teamPhotos: Record<string, TeamPhoto> = {
  "Udaay Sikder": {
    src: "/images/team/udaay-sikder.webp",
    src2x: "/images/team/udaay-sikder@2x.webp",
  },
  "Mohieminul Khan": {
    src: "/images/team/mohieminul-khan.webp",
    src2x: "/images/team/mohieminul-khan@2x.webp",
  },
};

export function getTeamPhoto(name: string): TeamPhoto | undefined {
  return teamPhotos[name];
}
