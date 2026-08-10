import Link from "next/link";

import { contactDetails, routes } from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function Footer({ t }: { t: Dictionary }) {
  const columns = [
    {
      heading: t.footer.servicesHeading,
      links: [
        {
          href: routes.aiSearchVisibility,
          label: t.services.aiSearchVisibility,
        },
        { href: routes.localSeo, label: t.services.localSeo },
        { href: routes.webDevelopment, label: t.services.webDevelopment },
        { href: routes.aiAutomation, label: t.services.aiAutomation },
      ],
    },
    {
      heading: t.footer.productsHeading,
      links: [
        { href: routes.products, label: t.nav.products },
        { href: routes.crawlmouse, label: t.products.crawlmouse },
        { href: routes.hafsaSastho, label: t.products.hafsaSastho },
      ],
    },
    {
      heading: t.footer.companyHeading,
      links: [
        { href: routes.about, label: t.nav.about },
        { href: routes.research, label: t.nav.research },
        { href: routes.blog, label: t.nav.blog },
        { href: routes.pricing, label: t.nav.pricing },
        { href: routes.contact, label: t.nav.contact },
      ],
    },
    {
      heading: t.footer.legalHeading,
      links: [
        { href: routes.privacy, label: t.legal.privacy },
        { href: routes.terms, label: t.legal.terms },
        { href: routes.dpa, label: t.legal.dpa },
      ],
    },
  ];

  return (
    <footer className="border-t border-divider bg-surface">
      <div className="mx-auto max-w-(--container-page) px-sm py-xl">
        <nav aria-label={t.a11y.footerNavigation}>
          <div className="grid grid-cols-2 gap-lg md:grid-cols-4">
            {columns.map((column) => (
              <div key={column.heading}>
                <h2 className="text-sm font-semibold text-text">
                  {column.heading}
                </h2>
                <ul className="mt-xs flex flex-col gap-3xs">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-text-muted link-accent hover:text-text"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="mt-xl flex flex-col gap-sm border-t border-divider pt-md md:flex-row md:items-end md:justify-between">
          <address className="text-sm text-text-muted not-italic">
            <span className="block font-semibold text-text">
              {t.footer.addressHeading}
            </span>
            <span className="block">{t.footer.street}</span>
            <span className="block">{t.footer.cityRegionPostal}</span>
            <a
              href={contactDetails.phoneHref}
              className="mt-3xs block link-accent hover:text-text"
            >
              {t.footer.phoneDisplay}
            </a>
            <a
              href={contactDetails.emailHref}
              className="block link-accent hover:text-text"
            >
              {t.footer.email}
            </a>
          </address>

          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} {t.site.legalName} {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
