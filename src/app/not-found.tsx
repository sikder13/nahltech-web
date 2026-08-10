import { Inter } from "next/font/google";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { routes } from "@/lib/routes";

import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * Root 404 boundary.
 *
 * Renders a complete document because it sits above `[locale]/layout.tsx`,
 * which is what supplies <html> for normal pages. It catches the 404s that
 * boundary cannot: a locale that is not live (`/ar`, `/bn`), where the locale
 * layout itself calls notFound() and so cannot wrap the result.
 *
 * Unmatched paths under a live locale are handled one level down by
 * `[locale]/not-found.tsx`, which keeps the header and footer.
 */
export default async function NotFound() {
  const t = await getDictionary(defaultLocale);

  return (
    <html lang={defaultLocale} dir="ltr" className={inter.variable}>
      <body className="flex min-h-dvh flex-col">
        <header className="border-b border-divider">
          <div className="mx-auto flex h-16 max-w-(--container-page) items-center px-sm">
            <Link
              href={routes.home}
              aria-label={t.a11y.homeLink}
              className="text-base font-bold tracking-tight text-text"
            >
              {t.site.name}
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-(--container-page) flex-1 px-sm py-3xl">
          <p className="text-sm font-semibold text-text-muted">404</p>
          <h1 className="mt-2xs text-3xl font-bold tracking-tight text-text">
            {t.notFound.title}
          </h1>
          <span className="mt-sm heading-rule" aria-hidden="true" />
          <p className="mt-md text-text-muted">{t.notFound.body}</p>
          <ButtonLink href={routes.home} className="mt-lg">
            {t.notFound.homeCta}
          </ButtonLink>
        </main>
      </body>
    </html>
  );
}
