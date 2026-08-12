import { describe, expect, it } from "vitest";

import { getAuthor } from "./authors";
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
      jobTitle: "Founder & CEO",
      url: "https://nahltech.com/about",
    });
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
