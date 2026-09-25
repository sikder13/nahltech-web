import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";

import { CalibrationModel } from "@/components/dashboard/v2/CalibrationModel";
import {
  EvidenceLabel,
  Labelled,
} from "@/components/dashboard/v2/EvidenceLabel";
import { SeriesChart } from "@/components/dashboard/v2/SeriesChart";
import { VisitBeacon } from "@/components/dashboard/v2/VisitBeacon";
import { FooterBase } from "@/components/layout/FooterBase";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { evidenceLabels, formatUsd } from "@/lib/dashboards/v2/model";
import {
  allDashboards,
  dashboardByToken,
  sharedCopy,
} from "@/lib/dashboards/v2/registry";
import { bookingUrl } from "@/lib/routes";

import type { Metadata } from "next";

/**
 * A prospect dashboard: the letter, continued.
 *
 * One scrolling page, built entirely from
 * `content/dashboards/<company>.json`. Adding a company is adding a file;
 * nothing on this page names one.
 *
 * Unlisted by construction: statically generated only for known tokens
 * (`dynamicParams = false`, so any other token is a plain 404), absent from
 * the sitemap, `noindex` in the head and in an `X-Robots-Tag` header from the
 * middleware, and reachable only from the address printed in the letter.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return allDashboards().map((d) => ({ token: d.token }));
}

type Params = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  const config = dashboardByToken(token);
  if (!config) return {};
  const shared = sharedCopy();
  return {
    title: `A cost model for ${config.company.name} | ${shared.firm}`,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function DashboardPage({ params }: Params) {
  const { token } = await params;
  const config = dashboardByToken(token);
  if (!config) notFound();
  const shared = sharedCopy();
  const { company, model, market, findings, respect, proposal } = config;
  // Ledger column gutter below the sm breakpoint; see the note at the table.
  const gap = proposal.ledger?.dense ? "pe-3xs" : "pe-2xs";
  const bookHref = bookingUrl ?? `mailto:${shared.book.email}`;
  // The site footer, every link and the same structure, minus the newsletter
  // form: this page asks for one thing only.
  const t = await requireDictionary("en");

  return (
    <>
      <main className="mx-auto max-w-(--container-measure) px-sm pt-lg pb-2xl lg:max-w-(--container-page) lg:px-md">
        {/* 1 · Title block */}
        <header>
          {/* The only header: the wordmark, home. No navigation. */}
          <Link
            href="/"
            className="inline-flex items-center gap-2xs text-sm font-semibold text-text link-accent"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- same fixed
              mark and the same measured reasoning as the site header. */}
            <img
              src="/images/logo-hex.webp"
              alt=""
              width={179}
              height={192}
              className="h-6 w-auto"
            />
            {shared.firm}
          </Link>
          <h1 className="mt-xl text-section text-balance text-text">
            {company.titleBreak ? (
              <>
                Prepared for
                <br className="sm:hidden" /> {company.name}
              </>
            ) : (
              <>Prepared for {company.name}</>
            )}
          </h1>
          <p className="mt-2xs text-text-muted">
            {company.town} · {company.prepared}
          </p>
          <span className="mt-md heading-rule" aria-hidden="true" />
        </header>

        {/* 2 · The number, and 3 · the sliders that make it */}
        <CalibrationModel
          model={model}
          copy={{
            caption: config.hero.caption,
            liveCaption: config.hero.liveCaption,
            subline: config.hero.subline,
            labelsLink: shared.labelsLink,
            resetLabel: shared.resetLabel,
            narrowedNote: shared.narrowedNote,
            nowLabel: shared.nowLabel,
            lowLabel: shared.lowLabel,
            highLabel: shared.highLabel,
            perYear: shared.perYear,
            computedLabel: shared.computedLabel,
            termsHeading: shared.termsHeading,
            typeLabel: shared.typeLabel,
            typeHint: shared.typeHint,
          }}
        />

        {/* 4 · The public series */}
        <section aria-labelledby="market-heading" className="mt-xl lg:mt-2xl">
          <h2 id="market-heading" className="text-section text-text">
            {market.heading}
          </h2>
          <span className="mt-xs heading-rule" aria-hidden="true" />
          <p className="mt-sm max-w-prose text-text">
            <Labelled text={market.intro} />
          </p>
          {/* Stacked on phones and tablets, side by side on desktop. */}
          <div className="mt-lg grid gap-lg lg:grid-cols-2">
            {market.charts.map((chart) => (
              <SeriesChart key={chart.title} chart={chart} />
            ))}
          </div>
          {market.notes.length > 0 ? (
            <ul className="mt-md max-w-prose space-y-2xs text-sm text-text">
              {market.notes.map((note) => (
                <li key={note.slice(0, 32)}>
                  <Labelled text={note} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* 5 · Further findings, when the letter's P.S. promised them */}
        {findings ? (
          <section
            aria-labelledby="findings-heading"
            className="mt-xl lg:mt-2xl"
          >
            <h2 id="findings-heading" className="text-section text-text">
              {findings.heading}
            </h2>
            <span className="mt-xs heading-rule" aria-hidden="true" />
            <div className="mt-lg grid gap-lg lg:grid-cols-2 lg:gap-2xl">
              {findings.items.map((item) => (
                <article key={item.title}>
                  <h3 className="text-lg font-semibold text-text">
                    <Labelled text={item.title} />
                  </h3>
                  {item.body.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 32)}
                      className="mt-xs max-w-prose text-text"
                    >
                      <Labelled text={paragraph} />
                    </p>
                  ))}
                  <p className="mt-xs max-w-prose text-text-muted">
                    {findings.closing}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-lg max-w-prose text-sm text-text-muted">
              <Link
                href={shared.method.href}
                className="text-text link-accent underline"
              >
                {shared.method.anchor}
              </Link>
              {shared.method.trail}
            </p>
          </section>
        ) : null}

        {/* 5b · What the company already runs, in the letter's own words */}
        {respect ? (
          <section
            aria-labelledby="respect-heading"
            className="mt-xl lg:mt-2xl"
          >
            <h2 id="respect-heading" className="text-section text-text">
              {respect.heading}
            </h2>
            <span className="mt-xs heading-rule" aria-hidden="true" />
            {respect.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 32)}
                className="mt-sm max-w-prose text-lg text-text"
              >
                <Labelled text={paragraph} />
              </p>
            ))}
          </section>
        ) : null}

        {/* 6 · The proposal: the letter's words, then the full offer */}
        <section aria-labelledby="proposal-heading" className="mt-xl lg:mt-2xl">
          <h2 id="proposal-heading" className="text-section text-text">
            {proposal.heading}
          </h2>
          <span className="mt-xs heading-rule" aria-hidden="true" />
          <blockquote className="mt-md border-s-4 border-accent ps-md">
            <p className="max-w-prose text-lg text-text">{proposal.lead}</p>
          </blockquote>

          <h3 className="mt-xl text-lg font-semibold text-text">
            {proposal.deliverablesHeading}
          </h3>
          <dl className="mt-sm grid gap-sm lg:grid-cols-3 lg:gap-lg">
            {proposal.deliverables.map((d) => (
              <div key={d.title}>
                <dt className="font-semibold text-text">{d.title}</dt>
                <dd className="mt-3xs max-w-prose text-text-muted">{d.line}</dd>
              </div>
            ))}
          </dl>

          {/* Word cells wrap and figures never break; a wide ledger tightens
              its phone gutters (config dense) instead of scrolling sideways.
              Without the flag the class strings are byte-identical to what
              shipped, which the Mursix golden gate proves. */}
          {proposal.ledger ? (
            <figure className="mt-lg rounded-lg border border-divider p-md">
              <div className="flex flex-wrap items-baseline justify-between gap-x-sm gap-y-2xs">
                <h4 className="text-sm font-semibold text-text">
                  {proposal.ledger.title}
                </h4>
                <span className="rounded-sm border border-dashed border-text px-[0.5em] py-[0.22em] text-[0.66rem] leading-none font-semibold tracking-[0.08em] text-text">
                  {proposal.ledger.label}
                </span>
              </div>
              <div
                className="mt-sm overflow-x-auto"
                tabIndex={0}
                role="region"
                aria-label={proposal.ledger.title}
              >
                <table className="w-full border-collapse text-xs tabular-nums sm:text-sm">
                  <thead>
                    <tr className="border-b border-border text-start text-text">
                      {proposal.ledger.columns.map((c, col) => (
                        <th
                          key={c}
                          scope="col"
                          className={`py-2xs ${gap} font-semibold last:pe-0 sm:pe-sm ${proposal.ledger!.rows.every((r) => /^[$\d.,%]+$/.test(r.cells[col] ?? "")) ? "text-end" : "text-start"}`}
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.ledger.rows.map((row) => (
                      <Fragment key={row.cells.join("|")}>
                        <tr
                          className={`${row.flag ? "bg-surface font-semibold text-text" : "border-b border-divider text-text-muted"}`}
                        >
                          {row.cells.map((cell, i) => (
                            <td
                              key={`${i}-${cell}`}
                              // Figures never break across lines; words may,
                              // so five columns still fit a 390px screen.
                              className={`py-2xs ${gap} last:pe-0 sm:pe-sm ${/^[$\d.,%]+$/.test(cell) ? "text-end whitespace-nowrap" : ""}`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                        {row.flag ? (
                          /* The reason sits under its row, full width, so the
                           outlier is explained without a sideways scroll. */
                          <tr className="border-b border-divider bg-surface text-text">
                            <td
                              colSpan={row.cells.length}
                              className="pe-sm pb-2xs text-xs"
                            >
                              <span className="me-2xs rounded-sm bg-text px-[0.4em] py-[0.1em] text-[0.66rem] font-semibold tracking-[0.08em] text-bg">
                                {shared.flagLabel}
                              </span>
                              {row.flag}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <figcaption className="mt-sm text-xs text-text-muted">
                {proposal.ledger.note}
              </figcaption>
            </figure>
          ) : null}

          <h3 className="mt-xl text-lg font-semibold text-text">
            {proposal.weeksHeading}
          </h3>
          <ol className="mt-sm grid gap-sm lg:grid-cols-3 lg:gap-lg">
            {proposal.weeks.map((w) => (
              <li
                key={w.when}
                className="grid gap-3xs sm:grid-cols-[9rem_1fr] sm:gap-sm lg:grid-cols-1 lg:content-start lg:gap-3xs lg:border-t lg:border-divider lg:pt-sm"
              >
                <span className="font-semibold text-text">{w.when}</span>
                <span className="max-w-prose text-text-muted">{w.what}</span>
              </li>
            ))}
          </ol>

          <h3 className="mt-xl text-lg font-semibold text-text">
            {proposal.feeHeading}
          </h3>
          <p className="mt-sm max-w-prose text-text">{proposal.fee}</p>
          <p className="mt-2xs max-w-prose text-text-muted">
            {proposal.feeCovers}
          </p>

          <p className="mt-lg max-w-prose rounded-lg border border-border p-md font-semibold text-text">
            {proposal.conversion}
          </p>
          {proposal.promise ? (
            <p className="mt-sm max-w-prose text-text">{proposal.promise}</p>
          ) : null}
        </section>

        {/* 7 · The ask */}
        <section aria-labelledby="book-heading" className="mt-xl lg:mt-2xl">
          <h2 id="book-heading" className="text-section text-text">
            {shared.book.heading}
          </h2>
          <span className="mt-xs heading-rule" aria-hidden="true" />
          <p className="mt-md max-w-prose text-text">{shared.book.body}</p>
          <a
            href={bookHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-lg block rounded-md bg-cta px-md py-sm text-center text-base font-semibold text-on-cta hover:bg-cta-hover sm:inline-block"
          >
            {shared.book.button}
          </a>
          <p className="mt-md flex flex-col gap-2xs text-text sm:flex-row sm:gap-lg">
            <a href={shared.book.phoneHref} className="link-accent underline">
              {shared.book.phoneLabel}
            </a>
            <a
              href={`mailto:${shared.book.email}`}
              className="link-accent underline"
            >
              {shared.book.email}
            </a>
          </p>
        </section>

        {/* 8 · Sources, the legend, and the promise */}
        <footer className="mt-3xl border-t border-divider pt-lg text-sm text-text-muted">
          <div className="grid gap-lg lg:grid-cols-2 lg:gap-2xl">
            <div>
              <h2 className="font-sans text-sm font-semibold text-text">
                {shared.sourcesHeading}
              </h2>
              <ul className="mt-2xs space-y-3xs">
                {config.sources.map((source) => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2
                id="labels"
                className="font-sans text-sm font-semibold text-text"
              >
                {shared.legendHeading}
              </h2>
              <dl className="mt-xs space-y-xs">
                {evidenceLabels.map((label) => (
                  <div key={label} className="flex items-start gap-sm">
                    <dt className="w-24 shrink-0 pt-[0.1em]">
                      <EvidenceLabel label={label} />
                    </dt>
                    <dd>{shared.legend[label]}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-sm">
                {shared.roundingNote.replace(
                  "{step}",
                  formatUsd(model.roundTo),
                )}
              </p>
            </div>
          </div>

          {findings ? null : (
            <p className="mt-lg">
              <Link
                href={shared.method.href}
                className="text-text link-accent underline"
              >
                {shared.method.anchor}
              </Link>
              {shared.method.trail}
            </p>
          )}

          <p className="mt-lg text-text">{shared.closing}</p>
          <p className="mt-xs text-text">{shared.privacy}</p>
        </footer>

        <VisitBeacon token={config.token} />
      </main>
      {/* The site footer is for the screen; a printed copy ends with the promise. */}
      <div className="print:hidden">
        {/* A letter to a prospect's owner links the company, not a code host. */}
        <FooterBase t={t} hideSocial={["github"]} />
      </div>
    </>
  );
}
