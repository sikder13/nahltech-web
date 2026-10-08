import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { EvidenceLabel } from "@/components/dashboard/v2/EvidenceLabel";
import { leadFieldLimits } from "@/lib/lead-schema";
import {
  letterSectionKeys,
  type LetterPageConfig,
  type LetterSectionKey,
  type LetterSharedCopy,
} from "@/lib/letter-pages/schema";

import { LetterActionBar } from "./LetterActionBar";
import { LetterDiagram } from "./LetterDiagram";
import { CheckMark, LetterIllustration } from "./LetterIllustration";
import { LetterModel } from "./LetterModel";
import { LetterVisitBeacon } from "./LetterVisitBeacon";
import { ReplyForm } from "./ReplyForm";

/**
 * A letter page: a proposal an owner reads in two or three minutes and
 * answers in ten seconds.
 *
 * Built on the dashboards' design system, so it carries the same weight:
 * the wordmark header, Fraunces headings over Inter, numbered sections under
 * a gold rule, bordered cards and the three evidence labels. What it leaves
 * out is the dashboard itself. There is one small model, and everything
 * about the provider's own business is a blank for their records to fill.
 *
 * Built entirely from `content/letter-pages/<slug>.json`. Nothing here names
 * a provider.
 */

const link = "underline underline-offset-4 link-accent";
const card = "rounded-lg border border-border p-sm lg:p-md";
const prose = "mt-md max-w-prose";

type SourceLink = { text: string; href: string };

/**
 * A body with its source phrases turned into links. Every character of the
 * body is rendered, in order; a link only wraps a span that is already there.
 */
function withSourceLinks(body: string, sources: readonly SourceLink[]) {
  const ordered = [...sources].sort(
    (a, b) => body.indexOf(a.text) - body.indexOf(b.text),
  );
  const parts: ReactNode[] = [];
  let rest = body;
  for (const source of ordered) {
    const at = rest.indexOf(source.text);
    parts.push(
      <Fragment key={source.text}>
        {rest.slice(0, at)}
        <a
          href={source.href}
          target="_blank"
          rel="noopener noreferrer"
          className={link}
        >
          {source.text}
        </a>
      </Fragment>,
    );
    rest = rest.slice(at + source.text.length);
  }
  parts.push(rest);
  return parts;
}

const numberOf = (key: LetterSectionKey) =>
  String(letterSectionKeys.indexOf(key) + 1).padStart(2, "0");

function Section({
  id,
  shared,
  children,
}: {
  id: LetterSectionKey;
  shared: LetterSharedCopy;
  children: ReactNode;
}) {
  const { name, eyebrow } = shared.sections[id];
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="mt-2xl scroll-mt-lg border-t border-divider pt-xl"
    >
      <p className="caption">
        <span className="font-semibold text-text">{numberOf(id)}</span>
        {eyebrow ? ` · ${eyebrow}` : null}
      </p>
      <h2 id={`${id}-heading`} className="mt-2xs text-section text-text">
        {name}
      </h2>
      <span className="mt-xs heading-rule" aria-hidden="true" />
      {children}
    </section>
  );
}

function CardHeading({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <>
      <p className="caption">{eyebrow}</p>
      <h3 className="mt-3xs text-xl text-text">{title}</h3>
    </>
  );
}

/** The site an outside source lives on, as its link text. */
const hostOf = (href: string) => new URL(href).host.replace(/^www\./, "");

export function LetterPage({
  config,
  shared,
  bookingUrl,
}: {
  config: LetterPageConfig;
  shared: LetterSharedCopy;
  bookingUrl: string;
}) {
  const { contact } = shared;
  // `?&body=` is the one spelling both iOS and Android read; where a device
  // ignores the body, the plain message still opens.
  const smsHref = `sms:${contact.text.number}?&body=${encodeURIComponent(contact.text.body)}`;
  const mailHref = `mailto:${contact.email.address}?subject=${encodeURIComponent(contact.email.subject)}`;
  const action =
    "flex min-h-14 items-center justify-center rounded-md border border-text px-sm text-center font-semibold text-text hover:bg-surface";
  const totalDays = shared.timeline.reduce((sum, step) => sum + step.days, 0);

  return (
    <div className="mx-auto max-w-(--container-page) px-sm pt-lg pb-2xl lg:grid lg:grid-cols-[13rem_minmax(0,46rem)] lg:gap-2xl lg:px-md">
      {/* The section index. Desktop only; a phone gets the action bar. */}
      <nav aria-label={config.title} className="hidden lg:block">
        <ol className="sticky top-lg space-y-2xs pt-[4.5rem] text-sm">
          {letterSectionKeys.map((key) => (
            <li key={key}>
              <a
                href={`#${key}`}
                className="flex gap-xs text-text-muted link-accent hover:text-text"
              >
                <span className="tabular-nums">{numberOf(key)}</span>
                {shared.sections[key].name}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <main className="min-w-0 text-lg text-text">
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
          <p className="mt-xl text-sm text-text-muted">
            {shared.topLine.replace("{provider}", config.company.name)}
          </p>
          <h1 className="mt-xs text-section text-balance text-text">
            {config.title}
          </h1>
          <p className="mt-xs text-text-muted">{config.subtitle}</p>
          <span className="mt-md heading-rule" aria-hidden="true" />
          <ul className="mt-md flex flex-wrap gap-2xs">
            {shared.chips.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-border px-sm py-3xs text-sm text-text"
              >
                {chip}
              </li>
            ))}
          </ul>
        </header>

        <Section id="handoff" shared={shared}>
          <p className={prose}>{config.handoff.body}</p>
          <LetterDiagram
            diagram={config.handoff.diagram}
            failLabel={shared.failLabel}
          />
        </Section>

        <Section id="whyNow" shared={shared}>
          <p className={prose}>{config.whyNow.body}</p>
        </Section>

        <Section id="rule" shared={shared}>
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-lg">
            <p className={prose}>
              {withSourceLinks(config.rule.body, config.rule.links)}
            </p>
            <ul className="mt-md space-y-xs">
              {config.rule.figures.map((figure) => {
                const source = config.rule.links.find(
                  (item) => item.text === figure.source,
                );
                return (
                  <li key={figure.line} className={card}>
                    <p className="font-display text-2xl text-text">
                      {figure.figure}
                    </p>
                    <p className="mt-2xs">
                      <EvidenceLabel label="BENCHMARK" />
                    </p>
                    <p className="mt-2xs text-sm text-text">{figure.line}</p>
                    {source ? (
                      <p className="mt-2xs text-sm">
                        <a
                          href={source.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-text-muted ${link}`}
                        >
                          {source.text}
                        </a>
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </Section>

        <Section id="build" shared={shared}>
          <p className={prose}>{config.build.body}</p>
          <LetterDiagram
            diagram={config.build.diagram}
            failLabel={shared.failLabel}
          />
          <div className={`mt-md ${card}`}>
            <h3 className="text-base font-semibold text-text">
              {shared.neverTouchesTitle}
            </h3>
            <p className="mt-2xs text-base text-text">
              {config.build.neverTouches}
            </p>
          </div>
        </Section>

        <Section id="whyItWorks" shared={shared}>
          <ul className="mt-md space-y-xs">
            {config.whyItWorks.map((item) => (
              <li key={item.text} className={card}>
                {item.href ? (
                  <p className="mb-2xs">
                    <EvidenceLabel label="BENCHMARK" />
                  </p>
                ) : null}
                <p className="max-w-prose text-base text-text">{item.text}</p>
                {item.href ? (
                  <p className="mt-2xs text-sm">
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-text-muted ${link}`}
                    >
                      {hostOf(item.href)}
                    </a>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="example" shared={shared}>
          <p className="mt-md max-w-prose border-s-4 border-accent ps-md">
            {shared.example.disclaimer}
          </p>
          <LetterModel example={config.example} labels={shared.example} />
        </Section>

        <Section id="morning" shared={shared}>
          <LetterIllustration
            morning={config.morning}
            label={shared.illustrationLabel}
          />
        </Section>

        <Section id="thirtyDays" shared={shared}>
          <ol className="mt-lg flex flex-col gap-xs lg:flex-row lg:gap-3xs">
            {shared.timeline.map((step) => (
              <li
                key={step.when}
                className="border-s-4 border-text ps-sm lg:border-s-0 lg:border-t-4 lg:ps-0 lg:pt-xs"
                style={{
                  flexGrow: step.days || 1,
                  flexBasis: `${((step.days || 1) / totalDays) * 100}%`,
                }}
              >
                <p className="caption">{step.when}</p>
                <p className="font-semibold text-text">{step.what}</p>
              </li>
            ))}
          </ol>

          <ul
            className={`mt-lg grid gap-xs ${config.thirtyDays.metrics.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
          >
            {config.thirtyDays.metrics.map((metric) => (
              <li key={metric} className={card}>
                <p className="font-semibold text-text">{metric}</p>
                <p className="mt-xs border-t border-dashed border-text pt-xs text-base text-text">
                  {shared.metric.placeholder}
                </p>
                <p className="mt-3xs text-sm text-text-muted">
                  {shared.metric.again}
                </p>
              </li>
            ))}
          </ul>

          <p className={prose}>{config.thirtyDays.body}</p>

          <div className="mt-lg grid gap-xs lg:grid-cols-2">
            <div className={card}>
              <CardHeading
                title={shared.receive.title}
                eyebrow={shared.receive.eyebrow}
              />
              <ul className="mt-sm space-y-xs text-base text-text">
                {config.thirtyDays.receive.map((item) => (
                  <li key={item} className="flex items-start gap-xs">
                    <CheckMark />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={card}>
              <CardHeading
                title={shared.fee.title}
                eyebrow={shared.fee.eyebrow}
              />
              <p className="mt-xs font-display text-display text-text tabular-nums">
                {config.thirtyDays.fee}
              </p>
              <ul className="mt-sm space-y-xs text-base text-text">
                {shared.fee.terms.map((term) => (
                  <li key={term} className="border-t border-divider pt-xs">
                    {term}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="team" shared={shared}>
          <ul className="mt-lg grid gap-xs sm:grid-cols-2">
            {shared.team.people.map((person) => (
              <li key={person.name} className={card}>
                <span
                  aria-hidden="true"
                  className="flex size-12 items-center justify-center rounded-full border border-text font-display text-lg text-text"
                >
                  {person.initials}
                </span>
                <h3 className="mt-sm text-xl text-text">{person.name}</h3>
                <p className="text-sm text-text-muted">{person.role}</p>
                <ul className="mt-xs space-y-3xs text-base text-text">
                  {person.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className={prose}>{shared.team.line}</p>
        </Section>

        <Section id="contact" shared={shared}>
          <p className={prose}>{contact.line}</p>
          <ul className="mt-lg grid gap-xs sm:grid-cols-2">
            <li>
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={action}
              >
                {contact.book}
              </a>
            </li>
            <li>
              <a href={contact.call.href} className={action}>
                {contact.call.label}
              </a>
            </li>
            <li>
              <a href={smsHref} className={action}>
                {contact.text.label}
              </a>
            </li>
            <li>
              <a href={mailHref} className={action}>
                {contact.email.address}
              </a>
            </li>
          </ul>
          <ReplyForm
            token={config.token}
            labels={contact.form}
            maxLength={leadFieldLimits.message}
          />
        </Section>

        <p className="mt-xl text-base text-text">{shared.closing}</p>
        <p className="mt-lg text-sm text-text-muted">{config.sources}</p>

        <LetterVisitBeacon token={config.token} />
      </main>

      <LetterActionBar
        contactId="contact"
        book={{ label: contact.book, href: bookingUrl }}
        text={{ label: contact.text.label, href: smsHref }}
      />
    </div>
  );
}
