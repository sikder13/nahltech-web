import type { Sheet } from "@/lib/sheets";

/**
 * One reference sheet: its first page, what it is, and the file.
 *
 * The same card on a provider's page, at that provider's permanent sheets
 * address and in the public library, so a sheet looks like the same object
 * wherever it is found. The link goes straight to the PDF: no form, no
 * address asked for, nothing recorded.
 */

/** "1 page · PDF · updated October 2026", built from the sheet itself. */
export function sheetMeta(sheet: Sheet): string {
  return `${sheet.pages} page${sheet.pages === 1 ? "" : "s"} · PDF · updated ${sheet.updated}`;
}

export function SheetCard({
  sheet,
  title,
  line,
  download,
  level = 3,
}: {
  sheet: Sheet;
  /** The page's own wording for this sheet; defaults to the registry's. */
  title?: string;
  line?: string;
  download: string;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  const name = title ?? sheet.title;
  return (
    <div className="flex h-full flex-col rounded-xl border border-divider bg-bg p-sm lg:p-md">
      {/* Decorative: the title beside it says what the sheet is. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed, pre-sized
          thumbnail served as it is; nothing for the image optimizer to do. */}
      <img
        src={sheet.thumb}
        alt=""
        width={640}
        height={828}
        loading="lazy"
        decoding="async"
        className="aspect-[640/400] w-full rounded-md border border-divider object-cover object-top"
      />
      <Heading className="mt-sm font-display text-2xl text-text">
        {name}
      </Heading>
      <p className="mt-2xs text-base text-text">{line ?? sheet.line}</p>
      <p className="mt-auto pt-sm">
        <a
          href={sheet.file}
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-text px-md text-base font-semibold text-text hover:bg-surface"
        >
          {download}
          <span className="sr-only">: {name}</span>
        </a>
      </p>
      <p className="mt-xs text-sm text-text-muted">{sheetMeta(sheet)}</p>
    </div>
  );
}

/** Older issues of a sheet, kept linked. Renders nothing until there is one. */
export function PreviousVersions({
  sheets,
  heading,
}: {
  sheets: readonly Sheet[];
  heading: string;
}) {
  const older = sheets.flatMap((sheet) =>
    sheet.previous.map((version) => ({ ...version, title: sheet.title })),
  );
  if (older.length === 0) return null;
  return (
    <section className="mt-xl">
      <h2 className="font-display text-xl text-text">{heading}</h2>
      <ul className="mt-xs space-y-3xs text-base">
        {older.map((version) => (
          <li key={version.file}>
            <a
              href={version.file}
              className="link-accent underline underline-offset-4"
            >
              {version.title}, {version.updated}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
