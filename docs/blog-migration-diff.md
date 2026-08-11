# Blog migration diff

What changed when the five legacy posts moved from `sikder13/Nahltech-mvp-001`
(`content/blog/*.md`) into this repo's MDX pipeline (`content/blog/*.mdx`).

Written so the prose edits can be reviewed line by line. Metadata, heading and
link changes are given by count; prose changes are given in full, before and
after. Every post keeps its original slug, so no redirect is required and the
old URLs continue to resolve.

**Method.** Prose was compared mechanically, not from memory: bodies were
stripped of frontmatter, emphasis markers normalised (`*x*` → `_x_`, which
Prettier applies on commit) and link syntax reduced to its visible text, then
diffed. Anything the diff surfaced is listed below. Two posts came through with
no prose change at all.

**Scope of editing.** Typos, grammar, and obviously redundant sentences only.
Voice, claims, facts, figures and the structure of each argument are unchanged.

---

## Summary

| Slug | Cluster | Words | h2 | Links | Prose edits |
| --- | --- | ---: | ---: | ---: | ---: |
| `building-ai-in-bengali-the-language-challenge-nobody-talks-about` | field-notes | 1,824 | 5 → 8 | 0 → 4 | 2 |
| `postpartum-depression-without-a-word-for-it` | field-notes | 1,479 | 6 → 6 | 0 → 4 | 1 |
| `the-data-gap-bangladeshs-4-million-births-invisible-to-ai` | field-notes | 1,389 | 6 → 6 | 0 → 4 | 0 |
| `two-immigrants-one-mission-why-we-are-building-for-home` | brand | 1,015 | 5 → 5 | 0 → 6 | 1 |
| `why-we-named-our-company-after-the-honeybee` | brand | 633 | 4 → 4 | 0 → 4 | 0 |

Applied to all five: `title` and `description` rewritten as on-SERP text
(keyword-led for field-notes, brand-voiced for brand); legacy `excerpt`, `tags`
and `readTime` fields dropped; `cluster`, `targetKeyword`, `serviceLinks` and
`draft` added. None of the legacy posts contained a single internal link.

---

## building-ai-in-bengali-the-language-challenge-nobody-talks-about

**Cluster** field-notes · **targetKeyword** `AI for low-resource languages`
(directional, unvalidated — no Keyword Planner data yet)

**Metadata** — 2 changed, 3 dropped, 4 added.
Title was "Building AI in Bengali: The Language Gap Nobody in Silicon Valley Is
Talking About"; now leads with the keyword.

**Headings** — 3 added, all by promotion rather than segmentation. The section
"Why Translation Alone Cannot Close the Gap" ran to roughly 640 words and
already contained three bolded run-in labels. Those labels became h2s
(`The Tokenization Problem`, `The Cultural Context Problem`,
`Exposure Is Not Comprehension`); no passage was cut to create a boundary that
was not already there. The third takes its wording from a sentence inside the
passage.

**Links** — 4 added: 1 product, 1 service, 2 siblings.

**Prose** — 2 edits.

1. Redundancy — "a problem … a problem" in one sentence.
   - Before: "Bengali falls into the latter category. **This is a problem that has significant consequences** for the 234 million people who speak it as their first language, **and it is a problem** the AI industry has not adequately confronted."
   - After: "Bengali falls into the latter category. **This has significant consequences** for the 234 million people who speak it as their first language, **and** the AI industry has not adequately confronted **it**."
2. Redundancy — a sentence restating the one before it, deleted.
   - Before: "… the relationship between how many people speak a language and how well AI systems can work in that language is weak at best. **Speaker count, the authors demonstrate, is not a reliable predictor of NLP resource availability.**"
   - After: "… the relationship between how many people speak a language and how well AI systems can work in that language is weak at best."

---

## postpartum-depression-without-a-word-for-it

**Cluster** field-notes · **targetKeyword** `postpartum depression in Bangladesh`
(directional, unvalidated)

**Metadata** — 2 changed, 3 dropped, 4 added. Title now leads with the keyword
and keeps the original phrase.

**Headings** — 0 changed. Six h2s across 1,479 words is roughly 245 words per
section, inside the target band.

**Links** — 4 added: 1 product, 1 service, 2 siblings.

**Prose** — 1 edit.

1. Grammar — comma splice around an appositive.
   - Before: "What has been missing is not evidence but **action, specifically, tools** designed to bring the evidence to the women who need it …"
   - After: "What has been missing is not evidence but **action — tools** designed to bring the evidence to the women who need it …"

Bengali script in the body (`ভারী`, `অন্যরকম`) is preserved.

---

## the-data-gap-bangladeshs-4-million-births-invisible-to-ai

**Cluster** field-notes · **targetKeyword** `maternal health data Bangladesh`
(directional, unvalidated)

**Metadata** — 3 changed, 3 dropped, 4 added. This is the post that carried the
byline typo: `author` was "Udaay Sikker", now "Udaay Sikder". Title now leads
with the keyword.

**Headings** — 0 changed.

**Links** — 4 added: 1 product, 1 service, 2 siblings.

**Prose** — 0 edits. The body is byte-identical apart from the added links and
Prettier's emphasis markers.

---

## two-immigrants-one-mission-why-we-are-building-for-home

**Cluster** brand · **targetKeyword** `null` (gates waived)

**Metadata** — 2 changed, 3 dropped, 4 added.

**Headings** — 0 changed.

**Links** — 6 added: 1 about, 1 product, 3 siblings, 1 contact.

**Prose** — 1 edit.

1. Redundancy — "invisible" twice in one sentence.
   - Before: "The healthcare infrastructure, the institutional scaffolding, the **invisible** support structures of daily life become **invisible** through familiarity."
   - After: "The healthcare infrastructure, the institutional scaffolding, the support structures of daily life become invisible through familiarity."

One further change is a link, but it altered visible text and is therefore
listed here too: the closing line pointed at an absolute self-URL, which is now
a relative internal link so it is checked by the loader's dead-link gate.

- Before: "… visit **nahltech.com/contact**."
- After: "… visit **our contact page**." (linked to `/contact`)

---

## why-we-named-our-company-after-the-honeybee

**Cluster** brand · **targetKeyword** `null` (gates waived)

**Metadata** — 1 changed, 3 dropped, 4 added. Title unchanged; it was already
brand-voiced.

**Headings** — 0 changed.

**Links** — 4 added: 1 about, 1 product, 2 siblings.

**Prose** — 0 edits.

---

## Flagged for founder review — not changed

These were found during the pass and deliberately left alone, because fixing
any of them would mean altering a claim or inventing a fact.

1. **Three citation mismatches in the data-gap post**, where the in-text
   attribution disagrees with that post's own reference list:
   - In text: "Gausia et al. (2007) … published in the _British Journal of
     Psychiatry_". Reference list: _Journal of Reproductive and Infant
     Psychology_, 25(4), 2007.
   - In text: "Nasreen et al. (2011), published in _BMC Pregnancy and
     Childbirth_". Reference list: Nasreen et al. (2010), _BMC Women's Health_.
   - In text, that Nasreen study is described as documenting postpartum
     depression; the reference title describes symptoms **during pregnancy**.

   The postpartum post cites the same two research groups and is internally
   consistent (Gausia 2009, _Psychological Medicine_; Nasreen 2010, _BMC
   Women's Health_), which suggests the data-gap post's in-text citations are
   the erroneous ones. Confirming that is a factual call, not an editorial one.

2. **Bengali speaker count differs between posts** — 234 million in the Bengali
   post, "approximately 230 million" in the data-gap post. Both are plausible
   roundings of the same Ethnologue figure, but they read as inconsistent when
   the two posts are linked to each other.

3. **Stale launch language in the honeybee post** — the closing italic line
   reads "Launching April 2026" and the body says "We are pre-launch". The post
   is dated 10 March 2026, so both were accurate when written, and
   `productLinks.hafsaSastho` is still `null`. A dated essay arguably keeps its
   original tense; the alternative is a founder-supplied update. Flagging
   rather than deciding.

4. **Competitor products are named** in the Bengali post ("GPT-4 is
   multilingual. Gemini is multilingual. Claude is multilingual."). This is
   fine in a founder essay analysing the industry, and it is the author's
   claim to make. Noting it only because the chat assistant's system prompt
   forbids naming competitors, so the two surfaces differ by design.
