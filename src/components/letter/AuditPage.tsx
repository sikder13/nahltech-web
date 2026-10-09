import Link from "next/link";

import { EvidenceLabel } from "@/components/dashboard/v2/EvidenceLabel";
import { SheetCard } from "@/components/sheets/SheetCard";
import { leadFieldLimits } from "@/lib/lead-schema";
import {
  auditSectionKeys,
  type AuditPageConfig,
  type AuditSectionKey,
} from "@/lib/letter-pages/audit-schema";

import { AuditBar, AuditIndex } from "./AuditNav";
import { LetterVisitBeacon } from "./LetterVisitBeacon";
import { PrototypeFrame } from "./PrototypeFrame";
import { ReplyForm } from "./ReplyForm";

import type { LetterSharedCopy } from "@/lib/letter-pages/schema";
import type { Sheet } from "@/lib/sheets";
import type { ReactNode } from "react";

/**
 * An audit page: what a business owner reads, in about three minutes, after
 * typing the address from a letter's P.S.
 *
 * It has one job, which is to make booking, calling, texting or writing feel
 * safe and obvious. So there is one primary button and it appears three
 * times; every section makes its point in its heading and first line; the
 * arithmetic and the long answers stay folded until asked for; and the line
 * that says no one will chase the reader sits beside every ask.
 *
 * Calm on purpose: a warm off-white ground, near-black ink, white cards with
 * a hairline, generous space, no shadows and no motion.
 *
 * Built entirely from `content/letter-audits/<slug>.json`. Nothing here
 * names a provider.
 */

/** The page's ground. Warmer than the site's white; text contrast is unchanged. */
const GROUND = "bg-[#faf8f4]";
/** The prototype's own desktop arrangement starts at 900px. */
const BOARD_WIDTH = 940;

const link = "underline underline-offset-4 link-accent";
const card = "rounded-xl border border-divider bg-bg p-sm lg:p-md";
/** Body text, held to about 68 characters a line at its own size. */
const body =
  "max-w-[38rem] text-lg leading-[1.6] text-text lg:text-[1.1875rem]";
const primary =
  "inline-flex min-h-14 items-center justify-center rounded-md bg-cta px-lg text-lg font-semibold text-on-cta hover:bg-cta-hover";
const secondary =
  "inline-flex min-h-14 items-center justify-center rounded-md border border-text px-lg text-lg font-semibold text-text hover:bg-surface";

const numberOf = (key: AuditSectionKey) =>
  String(auditSectionKeys.indexOf(key) + 1).padStart(2, "0");

function Section({
  id,
  title,
  eyebrow,
  children,
}: {
  id: AuditSectionKey;
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-md border-t border-divider py-14 lg:py-24"
    >
      <p className="caption">
        <span className="font-semibold text-text">{numberOf(id)}</span>
        {` · ${eyebrow}`}
      </p>
      <h2
        id={`${id}-heading`}
        className="mt-xs font-display text-[2rem] leading-[1.12] font-semibold text-balance text-text lg:text-[2.75rem]"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-text-muted ${link}`}
    >
      {children}
    </a>
  );
}

/** A folded block: the question or label shows, the rest opens on tap. */
function Fold({
  summary,
  children,
  className = "",
}: {
  summary: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={`group ${className}`}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-sm py-xs font-semibold text-text [&::-webkit-details-marker]:hidden">
        {summary}
        {/* A plus that becomes a minus, drawn with two bars. */}
        <span aria-hidden="true" className="relative size-4 shrink-0">
          <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-text" />
          <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-text group-open:hidden" />
        </span>
      </summary>
      <div className="pb-sm">{children}</div>
    </details>
  );
}

export function AuditPage({
  config,
  shared,
  sheets,
  boardHtml,
  bookingUrl,
}: {
  config: AuditPageConfig;
  /** The contact details and reply box copy every letter page uses. */
  shared: LetterSharedCopy;
  /** The sheets this page's cards name, in card order. */
  sheets: readonly Sheet[];
  boardHtml: string;
  bookingUrl: string;
}) {
  const { contact } = shared;
  const smsHref = `sms:${contact.text.number}?&body=${encodeURIComponent(contact.text.body)}`;
  const mailHref = `mailto:${contact.email.address}?subject=${encodeURIComponent(contact.email.subject)}`;
  const sheetsPath = `/${config.slug}/sheets`;
  const previewPath = `/m3/${config.token}/preview`;

  const titles: Record<AuditSectionKey, string> = {
    sheets: config.sheets.title,
    changed: config.changed.title,
    preview: config.preview.title,
    money: config.money.title,
    proof: config.proof.title,
    audit: config.audit.title,
    questions: config.questions.title,
    reply: config.reply.title,
  };

  /** The one primary action. Marked so the phone bar can step aside for it. */
  const book = (
    <a
      href={bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-primary-action=""
      className={primary}
    >
      {config.book}
    </a>
  );
  const safety = (
    <p className="mt-sm text-base text-text-muted">{config.safety}</p>
  );

  const [alwaysBefore, alwaysAfter] = config.sheets.always.split(
    config.sheets.address,
  );
  const changedLink = config.changed.bodyLink;
  const [changedBefore, changedAfter] = changedLink
    ? config.changed.body.split(changedLink.text)
    : [config.changed.body, ""];
  const shot = config.preview.shot ?? { width: 465, height: 3885 };

  return (
    <div className={GROUND}>
      <div className="mx-auto max-w-(--container-page) px-sm pt-lg lg:grid lg:grid-cols-[13rem_minmax(0,46rem)] lg:gap-2xl lg:px-md">
        <AuditIndex
          label={config.hero.title}
          items={auditSectionKeys.map((key) => ({
            id: key,
            number: numberOf(key),
            title: titles[key],
          }))}
        />

        <main className="min-w-0 pb-2xl">
          <header className="pb-14 lg:pb-24">
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
              {config.firm}
            </Link>
            <p className="mt-xl text-sm text-text-muted">{config.eyebrow}</p>
            <h1 className="mt-sm font-display text-[2.25rem] leading-[1.08] font-semibold text-balance text-text lg:text-[3.5rem]">
              {config.hero.title}
            </h1>
            <p className="mt-md max-w-[44rem] text-[1.375rem] leading-[1.45] text-text">
              {config.hero.lead}
            </p>
            <p className="mt-lg flex flex-col gap-xs sm:flex-row">
              {book}
              <a href="#sheets" className={secondary}>
                {config.hero.sheetsButton}
              </a>
            </p>
            <p className="mt-sm text-base text-text-muted">
              {config.hero.quiet}
            </p>
          </header>

          <Section
            id="sheets"
            title={config.sheets.title}
            eyebrow={config.sheets.eyebrow}
          >
            <p className={`mt-md ${body}`}>{config.sheets.lead}</p>
            <ul className="mt-lg grid gap-sm sm:grid-cols-2">
              {config.sheets.cards.map((item, index) => (
                <li key={item.sheet}>
                  <SheetCard
                    sheet={sheets[index]}
                    title={item.title}
                    line={item.line}
                    download={config.sheets.download}
                  />
                </li>
              ))}
            </ul>
            <p className="mt-md max-w-[38rem] text-base text-text-muted">
              {alwaysBefore}
              <a href={sheetsPath} className={link}>
                {config.sheets.address}
              </a>
              {alwaysAfter}
            </p>
          </Section>

          <Section
            id="changed"
            title={config.changed.title}
            eyebrow={config.changed.eyebrow}
          >
            <p className={`mt-md ${body}`}>{config.changed.lead}</p>
            <ul
              className={`mt-lg grid gap-sm ${config.changed.cards.length === 4 ? "sm:grid-cols-2" : "lg:grid-cols-3"}`}
            >
              {config.changed.cards.map((item) => (
                <li key={item.figure} className={card}>
                  <p className="font-display text-[1.75rem] leading-tight font-semibold text-text">
                    {item.figure}
                  </p>
                  <p className="mt-2xs">
                    <EvidenceLabel label="BENCHMARK" />
                  </p>
                  <p className="mt-xs text-base text-text">{item.line}</p>
                  <p className="mt-xs text-sm text-text-muted">
                    {item.href ? (
                      <SourceLink href={item.href}>{item.source}</SourceLink>
                    ) : (
                      item.source
                    )}
                  </p>
                </li>
              ))}
            </ul>
            <p className={`mt-lg ${body}`}>
              {changedLink ? (
                <>
                  {changedBefore}
                  <a
                    href={changedLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={link}
                  >
                    {changedLink.text}
                  </a>
                  {changedAfter}
                </>
              ) : (
                config.changed.body
              )}
            </p>
          </Section>

          <Section
            id="preview"
            title={config.preview.title}
            eyebrow={config.preview.eyebrow}
          >
            <p className={`mt-md ${body}`}>{config.preview.lead}</p>

            {/* Desktop: the prototype itself, in a thin frame. */}
            <div className="mt-lg hidden overflow-hidden rounded-xl border border-text bg-bg lg:block">
              <div
                aria-hidden="true"
                className="flex h-7 items-center gap-1.5 border-b border-divider bg-surface px-sm"
              >
                <span className="size-2 rounded-full bg-border" />
                <span className="size-2 rounded-full bg-border" />
                <span className="size-2 rounded-full bg-border" />
              </div>
              <PrototypeFrame
                html={boardHtml}
                title={config.preview.frameTitle}
                baseWidth={BOARD_WIDTH}
              />
            </div>

            {/* Phone: the top of the same screen as a picture, and a way in. */}
            <div className="mt-lg lg:hidden">
              <div className="max-h-[34rem] overflow-hidden rounded-xl border border-text bg-bg">
                {/* eslint-disable-next-line @next/next/no-img-element -- a fixed,
                    pre-sized picture served as it is. */}
                <img
                  src={`/letter/${config.slug}-board-phone.webp`}
                  alt={config.preview.frameTitle}
                  width={shot.width}
                  height={shot.height}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full"
                />
              </div>
              <p className="mt-sm">
                <a
                  href={previewPath}
                  className={`w-full sm:w-auto ${secondary}`}
                >
                  {config.preview.open}
                </a>
              </p>
            </div>

            <ul className="mt-md grid gap-xs text-sm text-text-muted sm:grid-cols-2 lg:grid-cols-4">
              {config.preview.captions.map((caption) => (
                <li key={caption} className="border-t border-text pt-2xs">
                  {caption}
                </li>
              ))}
            </ul>
          </Section>

          <Section
            id="money"
            title={config.money.title}
            eyebrow={config.money.eyebrow}
          >
            <p className={`mt-md ${body}`}>{config.money.lead}</p>
            <ul className="mt-lg border-b border-divider">
              {config.money.rows.map((row) => (
                <li key={row.title} className="border-t border-divider pt-sm">
                  <h3 className="font-display text-2xl text-text">
                    {row.title}
                  </h3>
                  <p className="mt-2xs max-w-[38rem] text-lg leading-[1.6] text-text">
                    {row.line}
                  </p>
                  <Fold summary={config.money.show} className="text-base">
                    <p className="max-w-[38rem] text-base leading-[1.6] text-text">
                      {row.arithmetic}
                    </p>
                  </Fold>
                </li>
              ))}
            </ul>
            <p className={`mt-lg ${body}`}>{config.money.after}</p>
          </Section>

          <Section
            id="proof"
            title={config.proof.title}
            eyebrow={config.proof.eyebrow}
          >
            <ul className="mt-lg grid gap-sm lg:grid-cols-3">
              {config.proof.cards.map((item) => (
                <li key={item.line} className={card}>
                  <p>
                    <EvidenceLabel label="BENCHMARK" />
                  </p>
                  <p className="mt-xs text-base leading-[1.6] text-text">
                    {item.line}
                  </p>
                  <p className="mt-xs text-sm">
                    <SourceLink href={item.href}>{item.source}</SourceLink>
                  </p>
                </li>
              ))}
            </ul>
            <p className={`mt-lg ${body}`}>{config.proof.after}</p>
          </Section>

          <Section
            id="audit"
            title={config.audit.title}
            eyebrow={config.audit.eyebrow}
          >
            {config.audit.steps.length > 0 || config.audit.boxes.length > 0 ? (
              <div className="mt-lg lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-lg">
                <ol className="border-s-2 border-text">
                  {config.audit.steps.map((step) => (
                    <li
                      key={step.label}
                      className="relative ps-md pb-md last:pb-0"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute top-[0.45em] -left-[7px] size-3 rounded-full bg-text"
                      />
                      <p className="font-semibold text-text">{step.label}</p>
                      <p className="mt-3xs text-base leading-[1.6] text-text">
                        {step.text}
                      </p>
                    </li>
                  ))}
                </ol>
                <ul className="mt-lg space-y-xs lg:mt-0">
                  {config.audit.boxes.map((box) => (
                    <li key={box.title} className={`${card} py-0 lg:py-0`}>
                      <Fold summary={box.title}>
                        <p className="text-base leading-[1.6] text-text">
                          {box.text}
                        </p>
                      </Fold>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className={`mt-lg ${card}`}>
              <h3 className="font-display text-2xl text-text">
                {config.audit.stepZero.title}
              </h3>
              <p className="mt-2xs max-w-[38rem] text-lg leading-[1.6] text-text">
                {config.audit.stepZero.text}
              </p>
            </div>

            <div className="mt-sm rounded-xl border-2 border-text bg-bg p-md lg:p-lg">
              <p className="font-display text-[4rem] leading-none font-semibold text-text tabular-nums">
                {config.audit.price.amount}
              </p>
              <p className="mt-xs text-lg font-semibold text-text">
                {config.audit.price.term}
              </p>
              <ul className="mt-md">
                {config.audit.price.lines.map((line) => (
                  <li
                    key={line}
                    className="border-t border-divider py-xs text-lg leading-[1.6] text-text"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-lg flex flex-col gap-xs sm:flex-row">
              {book}
              <a href={contact.call.href} className={secondary}>
                {contact.call.label}
              </a>
            </p>
            {safety}
          </Section>

          <Section
            id="questions"
            title={config.questions.title}
            eyebrow={config.questions.eyebrow}
          >
            <ul className="mt-lg border-b border-divider">
              {config.questions.items.map((item) => (
                <li key={item.q} className="border-t border-divider">
                  <Fold summary={item.q} className="text-lg">
                    <p className="max-w-[38rem] text-lg leading-[1.6] text-text">
                      {item.a}
                    </p>
                  </Fold>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            id="reply"
            title={config.reply.heading}
            eyebrow={config.reply.eyebrow}
          >
            <p className={`mt-md ${body}`}>{config.reply.line}</p>
            <p className="mt-lg">{book}</p>
            <ul className="mt-sm flex flex-col gap-3xs text-lg sm:flex-row sm:flex-wrap sm:gap-lg">
              <li>
                <a
                  href={contact.call.href}
                  className={`inline-flex min-h-12 items-center ${link}`}
                >
                  {contact.call.label}
                </a>
              </li>
              <li>
                <a
                  href={smsHref}
                  className={`inline-flex min-h-12 items-center ${link}`}
                >
                  {contact.text.label}
                </a>
              </li>
              <li>
                <a
                  href={mailHref}
                  className={`inline-flex min-h-12 items-center ${link}`}
                >
                  {contact.email.address}
                </a>
              </li>
            </ul>
            <ReplyForm
              token={config.token}
              labels={contact.form}
              maxLength={leadFieldLimits.message}
              quiet
            />
            <p className="mt-lg text-base text-text">{config.reply.closing}</p>
            <p className="mt-lg max-w-[38rem] text-sm text-text-muted">
              {config.sources}
            </p>
          </Section>

          <LetterVisitBeacon token={config.token} />
        </main>
      </div>

      <AuditBar
        book={{ label: config.bar.book, href: bookingUrl }}
        text={{ label: config.bar.text, href: smsHref }}
        sheets={{ label: config.bar.sheets, href: "#sheets" }}
      />
    </div>
  );
}
