import { describe, expect, it } from "vitest";

import { authorNames, getAuthor, getAuthorProfileUrl } from "./authors";
import { getPublishedPosts } from "./blog";
import { personSchema } from "./schema-org";

import en from "@/lib/i18n/dictionaries/en.json";

describe("author registry", () => {
  it("credits every published post to a known author", () => {
    // The loader enforces this at build time; asserting it here means a bad
    // byline is a test failure with a name in it, not a build stack trace.
    for (const post of getPublishedPosts()) {
      expect(
        getAuthor(post.author),
        `${post.slug} → "${post.author}"`,
      ).toBeDefined();
    }
  });

  it("agrees with the roles published on /about", () => {
    // The job titles are not ours to invent. Where a person appears on the
    // about page, the registry has to match it or one of the two is lying.
    for (const member of en.about.team) {
      const author = getAuthor(member.name);
      if (!author?.jobTitle) continue;
      expect(author.jobTitle, member.name).toBe(member.role);
    }
  });

  it("invents nothing for an author we were given little about", () => {
    // Read through getAuthor so the widened Author type is in play: the
    // literal registry type has no `url` key at all for her.
    const samia = getAuthor("Samia Zaman");
    expect(samia?.jobTitle).toBe("Social Media & Growth Manager");
    expect(samia?.sameAs).toEqual(["https://www.linkedin.com/in/samiazaman/"]);
    // No /about profile exists for her, so linking one would imply a page
    // that is not there.
    expect(samia?.url).toBeUndefined();
  });
});

describe("personSchema", () => {
  it("builds the full Person for a new author", () => {
    expect(personSchema("Samia Zaman")).toEqual({
      "@type": "Person",
      name: "Samia Zaman",
      jobTitle: "Social Media & Growth Manager",
      sameAs: ["https://www.linkedin.com/in/samiazaman/"],
      worksFor: {
        "@type": "Organization",
        name: "Nahl Technologies Inc.",
        url: "https://nahltech.com",
      },
    });
  });

  it("omits fields rather than emitting empty ones", () => {
    const schema = personSchema("Samia Zaman");
    // A guessed url says something false; an absent one says nothing.
    expect(schema).not.toHaveProperty("url");
  });

  it("resolves a registry url against the site origin", () => {
    expect(personSchema("Udaay Sikder")).toMatchObject({
      name: "Udaay Sikder",
      jobTitle: "Co-Founder & CEO",
      url: "https://nahltech.com/about",
    });
  });

  it("carries the second co-founder without inventing a profile for him", () => {
    // He is on /about, so the url is a page that exists. No sameAs was
    // supplied, and a Person node is the wrong place to guess one.
    const person = personSchema("Mohieminul Khan");

    expect(person).toMatchObject({
      "@type": "Person",
      name: "Mohieminul Khan",
      jobTitle: "Co-Founder & Director",
      url: "https://nahltech.com/about",
    });
    expect(person).not.toHaveProperty("sameAs");
  });

  it("keeps both co-founders' titles in step with the about page", () => {
    // The two titles are a matched pair — "Co-Founder & CEO" and
    // "Co-Founder & Director". Changing one on the page and not in the
    // registry is the failure this catches.
    const published = Object.fromEntries(
      en.about.team.map((member) => [member.name, member.role]),
    );
    expect(published["Udaay Sikder"]).toBe("Co-Founder & CEO");
    expect(published["Mohieminul Khan"]).toBe("Co-Founder & Director");
  });

  it("carries each author's personal LinkedIn on their Person node", () => {
    // These are personal profiles. They were removed from Organization
    // `sameAs` on purpose — the company entity gets company profiles — so
    // this is the only place they should appear.
    expect(personSchema("Udaay Sikder").sameAs).toEqual([
      "https://www.linkedin.com/in/udaaysikder/",
    ]);
    expect(personSchema("Samia Zaman").sameAs).toEqual([
      "https://www.linkedin.com/in/samiazaman/",
    ]);
  });

  it("degrades to a bare Person for an unknown name", () => {
    // Unreachable through the loader, which rejects unknown authors — this is
    // the belt to that braces.
    expect(personSchema("Nobody At All")).toEqual({
      "@type": "Person",
      name: "Nobody At All",
    });
  });
});

describe("getAuthorProfileUrl", () => {
  it("gives the byline the same URL the schema publishes", () => {
    // One source, so the visible link and the markup cannot point at
    // different places for the same person.
    for (const name of authorNames) {
      const profile = getAuthorProfileUrl(name);
      if (!profile) continue;
      expect(personSchema(name).sameAs, name).toContain(profile);
    }
  });

  it("finds LinkedIn by host, not by position in sameAs", () => {
    // A second profile added to sameAs later must not become the byline
    // target just because it was listed first.
    expect(getAuthorProfileUrl("Udaay Sikder")).toBe(
      "https://www.linkedin.com/in/udaaysikder/",
    );
    expect(getAuthorProfileUrl("Samia Zaman")).toBe(
      "https://www.linkedin.com/in/samiazaman/",
    );
  });

  it("returns nothing for an author we hold no profile for", () => {
    expect(getAuthorProfileUrl("Nobody At All")).toBeUndefined();
  });
});

describe("the decision cluster", () => {
  const decision = getPublishedPosts().filter((p) => p.cluster === "decision");

  it("has reached the size where the sibling gate applies", () => {
    expect(decision.length).toBeGreaterThanOrEqual(3);
  });

  it("gives every post two sibling links, so nothing is waived", () => {
    for (const post of decision) {
      const siblings = new Set(
        [...post.body.matchAll(/\]\((\/blog\/[a-z0-9-]+)\)/g)]
          .map((m) => m[1].slice("/blog/".length))
          .filter((slug) => slug !== post.slug),
      );
      expect(siblings.size, post.slug).toBeGreaterThanOrEqual(2);
    }
  });
});
