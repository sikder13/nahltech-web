import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";
import { allDashboards as templateOne } from "@/lib/dashboards/registry";
import { allDashboards as templateTwo } from "@/lib/dashboards/v2/registry";
import { allRoutePaths } from "@/lib/routes";

import {
  allLetterPages,
  letterPageByToken,
  letterPageRedirects,
  letterSharedCopy,
} from "./registry";
import { letterPageSchema } from "./schema";

describe("letter pages", () => {
  const pages = allLetterPages();

  it("loads and validates, with the shared contact block", () => {
    expect(pages.length).toBeGreaterThan(0);
    expect(() => letterSharedCopy()).not.toThrow();
  });

  it("has slugs and tokens no other prospect page uses", () => {
    const others = [...templateOne(), ...templateTwo()];
    const slugs = [...pages, ...others].map((p) => p.slug);
    const tokens = [...pages, ...others].map((p) => p.token);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it("never shadows a real site route with its short address", () => {
    const taken = new Set(allRoutePaths.map((p) => p.split("/")[1]));
    for (const page of pages) expect(taken.has(page.slug)).toBe(false);
  });

  it("gives each token the provider's name and ten hex characters", () => {
    for (const page of pages) {
      expect(page.token, page.slug).toMatch(/^[a-z]+(-[a-z]+)*-[0-9a-f]{10}$/);
    }
  });

  it("redirects each short address to its tokenized page, temporarily", () => {
    const redirects = letterPageRedirects();
    expect(redirects).toHaveLength(pages.length);
    for (const page of pages) {
      expect(redirects).toContainEqual({
        source: `/${page.slug}`,
        destination: `/m3/${page.token}`,
        permanent: false,
      });
    }
  });

  it("finds a page by its token and nothing by any other", () => {
    for (const page of pages) {
      expect(letterPageByToken(page.token)?.slug).toBe(page.slug);
    }
    expect(letterPageByToken("not-a-token-0000000000")).toBeUndefined();
  });

  it("stays out of the sitemap", () => {
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);
    for (const page of pages) {
      expect(paths).not.toContain(`/${page.slug}`);
    }
    expect(paths.filter((path) => path.startsWith("/m3"))).toEqual([]);
  });

  it("rejects a source link whose words are not in the body", () => {
    const [page] = pages;
    const broken = {
      ...page,
      blocks: page.blocks.map((block, index) =>
        index === 1
          ? {
              ...block,
              links: [
                {
                  text: "a phrase the body never says",
                  href: "https://example.com/",
                },
              ],
            }
          : block,
      ),
    };
    expect(letterPageSchema.safeParse(broken).success).toBe(false);
  });
});

describe("the first wave of letter pages", () => {
  it("is exactly the four providers the letters name", () => {
    expect(allLetterPages().map((page) => page.slug)).toEqual([
      "arrow",
      "dayafterday",
      "integritycare",
      "quinton",
    ]);
  });

  it("has every token recorded in the ledger, against its short address", () => {
    const ledger = readFileSync(
      path.join(process.cwd(), "docs", "anchor-ledger.md"),
      "utf8",
    );
    expect(ledger).toContain("## Prospect page tokens");
    for (const page of allLetterPages()) {
      expect(ledger).toContain(`\n/${page.slug}: ${page.token}\n`);
    }
  });
});

describe("the shared contact block", () => {
  const shared = letterSharedCopy();

  it("keeps the top line, the heading and the line under it", () => {
    expect(shared.topLine).toBe("Nahl Technologies Inc. · Indianapolis");
    expect(shared.contact.heading).toBe("Tell me where this is wrong");
    expect(shared.contact.line).toBe(
      "Whichever route is easiest. I keep seven to eight in the morning open for these calls.",
    );
  });

  it("keeps the four routes as written", () => {
    expect(shared.contact.book).toBe("Book fifteen minutes");
    expect(shared.contact.call).toEqual({
      label: "Call or text (317) 507-4303",
      href: "tel:+13175074303",
    });
    expect(shared.contact.text).toEqual({
      label: "Text Udaay",
      number: "+13175074303",
      body: "Read your letter. Call me at ",
    });
    expect(shared.contact.email).toEqual({
      address: "udaay@nahltech.com",
      subject: "Your letter",
    });
  });

  it("keeps the reply box's four strings", () => {
    expect(shared.contact.form).toEqual({
      placeholder: "Your phone or email, and one line if you like",
      send: "Send",
      success: "Got it. I will reply within one business day.",
      failure: "That did not go through. Text me at (317) 507-4303.",
    });
  });

  it("keeps the promise", () => {
    expect(shared.closing).toBe(
      "No one will call you because you visited this page.",
    );
  });
});
