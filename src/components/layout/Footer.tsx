import Link from "next/link";

import { NewsletterForm } from "@/components/conversion/NewsletterForm";
import { BrandIcon } from "@/components/ui/BrandIcon";
import {
  contactDetails,
  routes,
  serviceRouteKeys,
  socialLinks,
} from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function Footer({ t }: { t: Dictionary }) {
  const columns = [
    {
      heading: t.footer.servicesHeading,
      links: serviceRouteKeys.map((key) => ({
        href: routes[key],
        label: t.services[key],
      })),
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

        <div className="mt-xl border-t border-divider pt-md">
          <NewsletterForm
            labels={{
              ...t.newsletter,
              // Reuses the contact form's already-approved field label and
              // error copy rather than introducing a second wording for the
              // same thing.
              emailLabel: t.leadForm.email,
              emailInvalid: t.leadForm.errors.emailInvalid,
              rateLimited: t.leadForm.rateLimited,
              networkError: t.leadForm.networkError,
            }}
          />
        </div>

        <div className="mt-lg flex flex-col gap-sm border-t border-divider pt-md md:flex-row md:items-end md:justify-between">
          <div>
            <address className="text-sm text-text-muted not-italic">
              <span className="block font-semibold text-text">
                {t.footer.addressHeading}
              </span>
              <span className="block">{t.footer.street}</span>
              <span className="block">{t.footer.cityRegionPostal}</span>
              <a
                href={contactDetails.phoneHref}
                className="mt-3xs block w-fit py-3xs link-accent hover:text-text"
              >
                {t.footer.phoneDisplay}
              </a>
              <a
                href={contactDetails.emailHref}
                className="block w-fit py-3xs link-accent hover:text-text"
              >
                {t.footer.email}
              </a>
            </address>

            {/* Sits with the NAP because that is what these are: another way
                to reach us. Icon-only, so each link's `aria-label` is its
                whole accessible name — the mark carries no text. The list
                itself is named too, so a screen reader announces a group
                rather than three unrelated links.

                Focus rings come from the global `:focus-visible` rule in
                globals.css; the 40px box gives the target real area at touch
                size without the icon growing with it. */}
            <ul
              aria-label={t.footer.socialHeading}
              className="mt-xs flex items-center gap-3xs"
            >
              {socialLinks.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.footer.social[link.key]}
                    className="flex size-10 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg hover:text-text motion-reduce:transition-none"
                  >
                    <BrandIcon name={link.key} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} {t.site.legalName} {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
