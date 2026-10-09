/**
 * Pulls an email address and a phone number out of a one-line reply.
 *
 * The reply box asks for "your phone or email, and one line if you like", so
 * the text is free-form and either may be missing. Whatever is found goes in
 * its own column; the full text is always kept as the message, so nothing a
 * reader typed is lost to a parse that guessed wrong.
 */

const EMAIL =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;

/** Ten digits in any common North American grouping, with an optional +1. */
const PHONE =
  /(?<!\d)(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/;

export type ParsedReply = { email: string | null; phone: string | null };

export function parseReply(text: string): ParsedReply {
  const email = text.match(EMAIL)?.[0] ?? null;
  // Looked for in what is left, so digits inside an address are not a number.
  const rest = email ? text.replace(email, " ") : text;
  const phone = rest.match(PHONE)?.[0].trim() ?? null;
  return { email, phone };
}
