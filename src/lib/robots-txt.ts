import { siteUrl } from "@/lib/routes";

/**
 * The AI crawlers this site allows by name, in the order they are written out.
 *
 * Naming them is not redundant with `User-Agent: *`. Several of these agents
 * are operated by companies whose published policy is to look for their own
 * token first, and some infrastructure — Cloudflare's bot controls among it —
 * decides what to do with a request by checking whether the site named the
 * agent rather than by reading the wildcard. An explicit allow is the
 * difference between "not forbidden" and "invited".
 *
 * Three kinds sit here together on purpose:
 *
 *   search      OAI-SearchBot, Claude-SearchBot, PerplexityBot, Bingbot —
 *               they build the indexes assistants answer from. Bingbot is the
 *               one that matters most: ChatGPT and Copilot retrieval runs
 *               through Bing's index, so blocking it removes this site from
 *               both.
 *   agent       ChatGPT-User, Claude-User, Perplexity-User — live fetches
 *               made because a person asked a question about this site. These
 *               are readers, arriving one at a time.
 *   training    GPTBot, ClaudeBot, Google-Extended, Applebot-Extended,
 *               meta-externalagent. Allowed deliberately: the copy on this
 *               site is the sales argument, and a model that has read it can
 *               make that argument when we are not in the room.
 *
 * `Google-Extended` and `Applebot-Extended` are training-only controls and
 * carry no crawling of their own — listing them allows use, not access.
 */
export const aiCrawlers: readonly string[] = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "meta-externalagent",
];

/**
 * The Content Signals declaration, as the specification requires it: a comment
 * at the top of the file, before any group.
 *
 * It says the same thing the allow list says, in the vocabulary the signal
 * defines — search, ai-input (retrieval-augmented answers) and ai-train are
 * all yes. Two ways of stating one policy, which is the point: a consumer that
 * reads only one of them still gets the right answer.
 */
const CONTENT_SIGNAL =
  "# Content-Signal: search=yes, ai-input=yes, ai-train=yes";

/**
 * The whole file.
 *
 * The wildcard group, `Host` and `Sitemap` reproduce what the `robots.ts`
 * metadata route emitted, character for character — this file is additive and
 * `robots-txt.test.ts` fails if that stops being true. There are no
 * `Disallow` lines because there never were any: `/api/*` is rate-limited and
 * zod-validated rather than hidden, and adding a disallow now would be a
 * behaviour change dressed up as a comment.
 */
export function robotsTxt(): string {
  const groups = [
    "User-Agent: *\nAllow: /",
    ...aiCrawlers.map((agent) => `User-Agent: ${agent}\nAllow: /`),
  ];

  return [
    CONTENT_SIGNAL,
    "",
    groups.join("\n\n"),
    "",
    `Host: ${siteUrl}`,
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");
}
