import { describe, expect, it } from "vitest";

import { aiCrawlers, robotsTxt } from "./robots-txt";
import { siteUrl } from "./routes";

const txt = robotsTxt();
const lines = txt.split("\n");

describe("robots.txt — what was already there", () => {
  // This file moved from Next's `robots.ts` metadata convention to a route
  // handler so it could carry a comment. The move must be invisible to every
  // consumer that was already reading it, so the old output is asserted here
  // exactly as the metadata route produced it.
  it("keeps the wildcard group unchanged", () => {
    expect(txt).toContain("User-Agent: *\nAllow: /");
  });

  it("keeps the host and sitemap lines unchanged", () => {
    expect(txt).toContain(`Host: ${siteUrl}`);
    expect(txt).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);
    expect(siteUrl).toBe("https://nahltech.com");
  });

  it("adds no Disallow, because there was never one", () => {
    // The relay that added the allows said additions only. `/api/*` is
    // rate-limited and zod-validated rather than hidden, and inventing a
    // disallow here would be a behaviour change.
    expect(txt).not.toContain("Disallow");
  });
});

describe("robots.txt — the AI access declaration", () => {
  it("opens with the Content Signals comment", () => {
    // The specification puts it at the top of the file, before any group.
    // This is also the reason the metadata route could not be kept: its typed
    // return value has no way to emit a comment line at all.
    expect(lines[0]).toBe(
      "# Content-Signal: search=yes, ai-input=yes, ai-train=yes",
    );
  });

  it("names all twelve crawlers, each with its own allow", () => {
    expect(aiCrawlers).toHaveLength(12);
    for (const agent of aiCrawlers) {
      expect(txt, agent).toContain(`User-Agent: ${agent}\nAllow: /`);
    }
  });

  it("covers search, agent and training for both assistants we care about", () => {
    // Not a style check: these three do different jobs and allowing one does
    // not allow the others. Missing the -SearchBot keeps us out of the index
    // an assistant answers from even while its training crawler is welcome.
    for (const agent of [
      "GPTBot",
      "OAI-SearchBot",
      "ChatGPT-User",
      "ClaudeBot",
      "Claude-SearchBot",
      "Claude-User",
    ]) {
      expect(aiCrawlers, agent).toContain(agent);
    }
  });

  it("allows Bingbot by name", () => {
    // ChatGPT and Copilot retrieval runs through Bing's index. This one line
    // is the difference between being quotable by both and being invisible to
    // both, whatever the rest of the file says.
    expect(aiCrawlers).toContain("Bingbot");
  });

  it("ends with a newline and no blank-line runs", () => {
    expect(txt.endsWith("\n")).toBe(true);
    expect(txt).not.toContain("\n\n\n");
  });
});
