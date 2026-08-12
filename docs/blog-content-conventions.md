# Blog content conventions

Rules for writing and reviewing posts in `content/blog/`. The ones a machine
can check are enforced by the loader in `src/lib/blog.ts` and fail the build;
the rest are review conventions and are marked as such.

The migration record for the original five posts is in
`docs/blog-migration-diff.md`. Architecture is ARCH-1 §4.3.

---

## Frontmatter

Every post needs `title`, `description`, `date`, `author`, `cluster`,
`targetKeyword`, `serviceLinks` and `draft`. Enforced by a zod schema; a
failure names the file and the field.

- **`title`** doubles as the h1 and the on-SERP title tag. Keyword-led for
  `field-notes` and `decision`, brand-voiced for `brand`.
- **`description`** is the meta description, not a summary for readers. Aim
  for something that reads as a reason to click.
- **`date`** may be quoted or unquoted. Unquoted YAML dates parse as a Date
  object rather than a string; the loader normalises both to `YYYY-MM-DD`, so
  the quoting style is not load-bearing.
- **`targetKeyword`** may be `null` only for gate-exempt clusters.
- **`draft: true`** keeps a post out of the hub, the feed, the sitemap and the
  route table.

## Clusters

| Cluster | What it is | Keyword and link gates |
| --- | --- | --- |
| `field-notes` | Research and practice writing, an SEO play | Enforced |
| `decision` | Buyer-intent pieces answering a purchase question | Enforced |
| `brand` | The company's own story | Waived |
| `archive` | Heritage content migrated as-is | Waived |

The waiver covers the keyword and linking requirements only. Dead-link
checking applies to every cluster: the point is that we do not require links
in an essay that does not want them, not that we tolerate broken ones.

## Link gates

Enforced at build time for `field-notes` and `decision`:

1. **At least one offer link** — to `/services/*`, `/products/*` or
   `/pricing`.
2. **At least two sibling-post links**, but only once the post's cluster holds
   three or more published posts. The first post in a cluster has no siblings
   and the second has one, so enforcing the rule from the start would either
   block the post or force a link to an unrelated cluster.
3. **Every internal link resolves** — against `lib/routes.ts` for pages and
   against the files in `content/blog/` for siblings.

Posts that pass under the sibling waiver are listed in a build `NOTICE`, with
their cluster, its current size and their sibling count. The notice is not a
warning: nothing is wrong and the post was allowed on purpose. It exists so
backfilling links as a cluster grows is visible work rather than something we
have to remember.

## Crawlmouse links — standing rule

Crawlmouse is our own property, so links to it are followed: no `nofollow`.
They open in a new tab with `rel="noopener noreferrer"`, the same treatment
every off-site link gets.

That makes restraint the reviewer's job rather than the crawler's:

- **One or two per post. Never more.**
- **Only where the reader genuinely benefits** — a point where running an
  audit is the obvious next action, not a paragraph that merely mentions
  websites.
- **Vary the anchor text.** "Crawlmouse", "our free audit tool", "run a free
  site audit". Never the same anchor twice in one post.
- **None at all in posts with no honest Crawlmouse angle.** A post that has no
  reason to send someone to an audit tool should not contain the link. Absence
  is the correct outcome, not a gap to fill.

The reasoning is the same one behind the cluster waivers. A self-serving link
placed where it does not belong costs a reader's trust, and trust is the thing
the writing is for.

## Headings

One h1, supplied by the template from `title` — never write an h1 in the body.
Descriptive h2s roughly every 200–350 words. Add a heading where a boundary
already exists; never split a flowing passage to hit the interval. h2s become
the table of contents, so they should read as a summary of the argument.

## Structured data

Emitted automatically from the post, never hand-written alongside it:

- **Article** on every post.
- **FAQPage** when the body has a "Frequently asked questions" h2. Each h3 in
  that section is a question and the prose beneath it is the answer, parsed
  from the body so the markup and the visible text cannot drift apart. Editing
  a question in the MDX changes the schema in the same edit.

To add an FAQ, write the section. There is nothing else to wire up.

## Prose

- Banned words (CLAUDE.md rule 15): empower, leverage, unlock, transform,
  harness, cutting-edge, innovative, world-class, and "solutions" as a
  standalone noun.
- Em dashes: at most one per paragraph. Clause-joining dashes become periods.
- Never invent a product fact, statistic, client claim or price (rule 12).
  Figures come from the founder or from a cited source.
- Cite specifically. A claim attributed to a study needs the study, and the
  in-text attribution must agree with the reference list.
