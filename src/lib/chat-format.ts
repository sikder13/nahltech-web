/**
 * The wire format between the chat model and the chat panel.
 *
 * Two things live here, both of them the client half of a prompt rule:
 *
 * 1. `[[LEAD_FORM]]` — the model's way of saying "show the lead form now".
 *    CC-5 guessed at this from a regex over the transcript, which meant a
 *    conversation could qualify completely and never surface a form, because
 *    the visitor had not happened to type an email address. The model knows
 *    when it has made the offer; this lets it say so. The token is protocol,
 *    not copy: it is stripped from what the visitor reads AND from what we
 *    log, so it never reaches the transcript, and never comes back as history
 *    on the next turn.
 *
 * 2. The markdown scrub. The prompt forbids markdown outright, which is the
 *    real fix; this is the belt to that pair of braces. It runs on display
 *    only — the logged text stays exactly as the model wrote it, so the
 *    transcript is evidence of the model's behaviour rather than a cleaned-up
 *    version of it. A prompt regression is then visible in the database
 *    instead of hidden by the renderer that papers over it.
 *
 * Both functions are pure and shared: `chat-prompt.ts` builds the token into
 * the instructions from the same constant the panel matches on, so the two
 * cannot drift apart.
 */

export const LEAD_FORM_TOKEN = "[[LEAD_FORM]]";

/** Every occurrence, with the surrounding blank line it sits on. */
const TOKEN_PATTERN = /[ \t]*\[\[LEAD_FORM\]\][ \t]*\n?/g;

export type LeadSignal = {
  /** The reply with the token removed. Safe to display, log and replay. */
  text: string;
  /** True when the model asked for the lead form on this turn. */
  requested: boolean;
};

/**
 * Splits the lead signal off a reply.
 *
 * Applied to the finished reply before it is stored or logged, so the token
 * exists only in transit.
 */
export function extractLeadSignal(reply: string): LeadSignal {
  const requested = reply.includes(LEAD_FORM_TOKEN);
  if (!requested) return { text: reply, requested };

  return { text: reply.replace(TOKEN_PATTERN, "").trimEnd(), requested };
}

/**
 * Hides a token that is still arriving.
 *
 * Streaming delivers the token a few characters at a time, so a reply ending
 * in the token spends a frame or two showing `[[LEAD_FO` before the match
 * completes. Anything that is a prefix of the token and sits at the very end
 * of the text is therefore hidden. It costs a trailing `[` in the vanishingly
 * rare case a reply ends with one; the prompt forbids brackets in prose, and a
 * half-written token in front of a visitor is the worse of the two.
 */
function hidePartialToken(text: string): string {
  for (let length = LEAD_FORM_TOKEN.length - 1; length > 0; length -= 1) {
    if (text.endsWith(LEAD_FORM_TOKEN.slice(0, length))) {
      return text.slice(0, text.length - length);
    }
  }
  return text;
}

/**
 * What the visitor actually reads.
 *
 * Strips the markdown the prompt already forbids — stray `**`, and a leading
 * bullet marker on any line — and hides a token mid-flight. Display only:
 * pass the stored text, never the result, to the logger.
 */
export function renderAssistantText(content: string): string {
  // Stored text has already been through `extractLeadSignal`. Running it again
  // here is not redundant so much as unconditional: "the visitor never sees
  // the token" then holds at the last point before the DOM, whatever happened
  // upstream.
  return hidePartialToken(extractLeadSignal(content).text)
    .split("\n")
    .map((line) =>
      line
        // `**bold**` renders as literal asterisks in a text node, which is
        // exactly what production QA saw. Asterisk bullets get the same
        // treatment as hyphen ones — the same leak, one character apart.
        .replace(/^\s*[-*]\s+/, "")
        .replace(/\*\*/g, ""),
    )
    .join("\n")
    .trimEnd();
}
