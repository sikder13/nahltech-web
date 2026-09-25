/**
 * Crawlers, link previewers, audit tools and headless browsers. The user
 * agent is read to make this one decision and is never stored: a visit from
 * any of these is not a reader, and counting it could read as the prospect
 * returning when they did not.
 */
const NOT_A_READER =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|inspectiontool|preview|facebookexternalhit|embedly|quora link|whatsapp|skype|bingpreview|python|curl|wget|node-fetch|axios|playwright|puppeteer/i;

export function isReaderAgent(userAgent: string | null): boolean {
  return Boolean(
    userAgent && userAgent.length > 10 && !NOT_A_READER.test(userAgent),
  );
}
