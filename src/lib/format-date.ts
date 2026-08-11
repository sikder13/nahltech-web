/**
 * Display format for post dates.
 *
 * Fixed to en-US and UTC on purpose. The machine-readable value stays the raw
 * `YYYY-MM-DD` from the frontmatter, in the `datetime` attribute; this is only
 * the human-facing string. Parsing without a timezone would let a build
 * machine west of UTC render the previous day.
 */
export function formatPostDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
