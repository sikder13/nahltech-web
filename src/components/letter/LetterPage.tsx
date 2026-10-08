import { Fragment, type ReactNode } from "react";

import { LetterVisitBeacon } from "./LetterVisitBeacon";
import { ReplyForm } from "./ReplyForm";

import type {
  LetterBlock,
  LetterPageConfig,
  LetterSharedCopy,
} from "@/lib/letter-pages/schema";

/**
 * A letter page: the second half of a one-page mailed letter.
 *
 * Set in the display serif throughout and held to a letter's measure, so it
 * reads as correspondence rather than as a dashboard. Four headed blocks, the
 * ways to reply, the promise, the sources. No images, no icons, no charts.
 *
 * Built entirely from `content/letter-pages/<slug>.json`. Nothing here names
 * a provider.
 */

const link = "underline underline-offset-4 link-accent";

/**
 * The body with its source phrases turned into links. Every character of the
 * body is rendered, in order; a link only wraps a span that is already there.
 */
function withSourceLinks(block: LetterBlock): ReactNode {
  const links = [...block.links].sort(
    (a, b) => block.body.indexOf(a.text) - block.body.indexOf(b.text),
  );
  const parts: ReactNode[] = [];
  let rest = block.body;
  for (const source of links) {
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

  return (
    <main className="mx-auto max-w-[39rem] px-sm pt-lg pb-2xl font-display text-lg leading-relaxed text-text lg:max-w-[42.5rem] lg:pt-2xl lg:text-xl lg:leading-relaxed">
      <header>
        <p className="text-sm text-text-muted">{shared.topLine}</p>
        <h1 className="mt-xl text-section text-balance text-text">
          {config.title}
        </h1>
        <p className="mt-sm text-text-muted">{config.subtitle}</p>
      </header>

      {config.blocks.map((block) => (
        <section
          key={block.heading}
          className="mt-xl border-t border-divider pt-xl"
        >
          <h2 className="text-xl text-text lg:text-2xl">{block.heading}</h2>
          <p className="mt-sm">{withSourceLinks(block)}</p>
        </section>
      ))}

      <section
        aria-labelledby="reply-heading"
        className="mt-xl border-t border-divider pt-xl"
      >
        <h2 id="reply-heading" className="text-xl text-text lg:text-2xl">
          {contact.heading}
        </h2>
        <p className="mt-sm">{contact.line}</p>
        <ul className="mt-lg space-y-xs">
          <li>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center rounded-md bg-cta px-lg font-semibold text-on-cta hover:bg-cta-hover sm:inline-flex"
            >
              {contact.book}
            </a>
          </li>
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
        <ReplyForm token={config.token} labels={contact.form} />
      </section>

      <p className="mt-xl text-base text-text">{shared.closing}</p>
      <p className="mt-lg text-sm text-text-muted">{config.sources}</p>

      <LetterVisitBeacon token={config.token} />
    </main>
  );
}
