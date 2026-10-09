import { PageHeader } from "@/components/blocks/PageHeader";
import { PreviousVersions, SheetCard } from "@/components/sheets/SheetCard";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { routes } from "@/lib/routes";
import { allSheets, sheetGroups } from "@/lib/sheets";

import type { Metadata } from "next";

/**
 * The public library of reference sheets.
 *
 * Every sheet enclosed with a letter is also here, grouped by who it is for,
 * so the address can be given to anyone. The cards link the same files a
 * provider's own page does; see `lib/sheets.ts`.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return {
    alternates: { canonical: routes.sheets },
    title: t.pages.sheets.title,
    description: t.pages.sheets.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return (
    <>
      <PageHeader title={t.pages.sheets.title} intro={t.sheets.intro} />
      <div className="mx-auto max-w-(--container-page) px-sm pb-2xl">
        {sheetGroups().map((group) => (
          <section key={group.id} className="mt-lg first:mt-0">
            <h2 className="text-section text-text">{group.title}</h2>
            <span className="mt-xs heading-rule" aria-hidden="true" />
            <ul className="mt-lg grid gap-sm sm:grid-cols-2 lg:grid-cols-3">
              {group.sheets.map((sheet) => (
                <li key={sheet.id}>
                  <SheetCard sheet={sheet} download={t.sheets.download} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        <PreviousVersions
          sheets={allSheets()}
          heading={t.sheets.previousVersions}
        />
      </div>
    </>
  );
}
