/**
 * Who can be credited on a post.
 *
 * The `author` frontmatter field is a plain string, and before this registry
 * existed the Person schema gave every author the same `/about` URL and no
 * title. That was wrong the moment a second person wrote something.
 *
 * Being a closed set is the point: the loader checks membership, so a
 * misspelled byline fails the build instead of shipping. The original
 * migration carried "Udaay Sikker" for exactly that reason.
 *
 * Nothing here is invented. A person gets a title, a profile URL or an
 * external link only when we have been given one (hard rule 12).
 */

export type Author = {
  name: string;
  /** Omitted rather than guessed when no approved title exists. */
  jobTitle?: string;
  /** A page on this site about the person, when there is one. */
  url?: string;
  /** External profiles we have been given. Never inferred from a name. */
  sameAs?: string[];
};

export const authors = {
  "Udaay Sikder": {
    name: "Udaay Sikder",
    // Matches the role published on /about. `authors.test.ts` asserts the two
    // stay in agreement.
    jobTitle: "Founder & CEO",
    url: "/about",
  },
  "Samia Zaman": {
    name: "Samia Zaman",
    jobTitle: "Social Media & Growth Manager",
    // No `url`: she is not on the /about page, and pointing at it would imply
    // a profile that is not there. One external link, as supplied.
    sameAs: ["https://www.linkedin.com/in/samiazaman/"],
  },
} satisfies Record<string, Author>;

export type AuthorName = keyof typeof authors;

export const authorNames = Object.keys(authors) as AuthorName[];

export function getAuthor(name: string): Author | undefined {
  return (authors as Record<string, Author>)[name];
}
