import { describe, expect, it } from "vitest";

import { getPublishedPosts } from "./blog";
import { getPublishedResearch } from "./research";
import { allRoutePaths, routes, softwarePageLinkPaths } from "./routes";
import { dictionaryFaqSchema } from "./schema-org";

import en from "@/lib/i18n/dictionaries/en.json";

/**
 * `/services/software-development` carries approved copy with links inside
 * its sentences. The copy is stored cut at each anchor, so what has to hold
 * is that the pieces rejoin to the approved text and that every anchor has a
 * published destination. Independent copies of the approved text, not ones
 * read back from the dictionary.
 */
const page = en.servicePages.softwareDevelopment;

const join = (segments: readonly { text: string }[]) =>
  segments.map((segment) => segment.text).join("");

const linksOf = (segments: readonly { text: string; link?: string }[]) =>
  segments.flatMap((segment) =>
    segment.link ? [[segment.text, segment.link]] : [],
  );

describe("the software development page copy", () => {
  it("keeps the headline and replaces the intro", () => {
    expect(page.headline).toBe("Off-the-shelf stopped fitting.");
    expect(page.problem).toBe(
      "We build web apps, SaaS first versions, internal tools, desktop apps, and browser extensions, and we run a live SaaS product of our own, so you can check our work in production rather than in a portfolio. Scoped builds are $15,000 to $45,000, published before we talk, with a 75 day delivery guarantee. We work with businesses across North America, the Gulf region, Central Asia, and New Zealand, in English, Bengali, and with native reviewers for Arabic when a project needs it.",
    );
  });

  it("rejoins the proof section to the approved paragraph", () => {
    expect(page.proof.heading).toBe("Proof you can check");
    expect(join(page.proof.body)).toBe(
      "Crawlmouse is a website auditing SaaS we built and operate. Since June 2026 it has run 145 audits, crawled 20,573 pages, and mapped 1.3 million links, on Next.js, Supabase, Inngest, Stripe, and Vercel. Read how it was built and what it runs on. Hafsa Sastho is a Bengali language AI health companion we built for mothers in Bangladesh, now in beta, with the Android release on Google Play planned for the first week of November 2026.",
    );
  });

  it("lists the six kinds of build", () => {
    expect(page.builds.heading).toBe("What we build");
    expect(page.builds.items).toEqual([
      "Web apps and customer portals: accounts, documents, booking, billing, dashboards.",
      "SaaS first versions: multi tenant accounts, billing, background jobs, the admin tools to support early customers.",
      "Internal tools: quoting, intake, scheduling, reconciliation, the spreadsheet that became a business process.",
      "Desktop apps: when the work is offline, on a shop floor, or needs the file system.",
      "Browser extensions: Manifest V3, built to the August 2026 Chrome Web Store policy, usually as the capture point for a web app.",
      "Multilingual and regional builds: PDPL, PIPEDA, and HIPAA requirements scoped in from day one, not retrofitted.",
    ]);
  });

  it("rejoins the cost section to the approved paragraph", () => {
    expect(page.cost.heading).toBe("What it costs");
    expect(join(page.cost.body)).toBe(
      "Software development runs $15,000 to $45,000 for a scoped build; AI automation builds from $7,500; web development from $6,000. Every figure is on the pricing page and we do not quote above it. Scoped builds go live in 75 days or your money back. The first step is a free 30 minute scan; if the project is real, the $2,500 AI Opportunity Audit is credited in full toward the build within 90 days. For the survey data behind these numbers, read custom software development cost in 2026; for the build or buy question, read build vs buy software for a small business.",
    );
  });

  it("appends the four new questions after the three it already had", () => {
    expect(page.faq.map((entry) => entry.question)).toEqual([
      "Why won't you quote without an audit?",
      "What stack do you use?",
      'What does "typically $15,000–$45,000" cover?',
      "How much does custom software development cost?",
      "Have you built and shipped a SaaS product?",
      "Do you build Chrome extensions?",
      "Can you build for businesses outside the United States?",
    ]);
  });

  it("puts every question into the FAQPage markup", () => {
    const schema = dictionaryFaqSchema(page.faq) as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(schema.mainEntity.map((entry) => entry.name)).toEqual(
      page.faq.map((entry) => entry.question),
    );
    expect(schema.mainEntity.at(-1)!.acceptedAnswer.text).toBe(
      "Yes. We work remotely with businesses in Canada, the Gulf region, Central Asia, and New Zealand, scope regional data rules such as PDPL and PIPEDA into the requirements, and invoice in US dollars.",
    );
  });
});

describe("the software development page links", () => {
  it("carries exactly the four anchors the copy was written with", () => {
    expect([...linksOf(page.proof.body), ...linksOf(page.cost.body)]).toEqual([
      ["Read how it was built and what it runs on", "crawlmouseBuild"],
      ["pricing page", "pricing"],
      ["custom software development cost in 2026", "softwareCost"],
      ["build vs buy software for a small business", "buildVsBuy"],
    ]);
  });

  it("points each one at a published document or a registered route", () => {
    // These anchors live in a component, so the MDX gates never see them.
    // This stands in: hard rule 7 for links that cross from a page into the
    // post and research collections.
    const published = new Set<string>([
      ...allRoutePaths,
      ...getPublishedPosts().map((post) => `${routes.blog}/${post.slug}`),
      ...getPublishedResearch().map(
        (article) => `${routes.research}/${article.slug}`,
      ),
    ]);
    for (const [key, path] of Object.entries(softwarePageLinkPaths)) {
      expect(published, `${key} -> ${path}`).toContain(path);
    }
  });
});

describe("the software development page metadata", () => {
  it("carries the approved title", () => {
    expect(en.pages.softwareDevelopment.metaTitle).toBe(
      "Custom Software Development, Priced and Published | Nahl Technologies",
    );
  });

  it("carries the approved description", () => {
    expect(en.pages.softwareDevelopment.description).toBe(
      "Custom software, web apps, SaaS first versions, desktop apps, and browser extensions, built by the team that runs its own live product. $15,000 to $45,000, published.",
    );
  });
});
