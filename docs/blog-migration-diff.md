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

## Founder rulings, 11 August 2026

The four items below were raised at migration and ruled on afterwards. Three
were fixed and one was resolved as no-change; the edits are recorded here as a
second pass, distinct from the migration edits above. Two consequences of the
citation work are still open and are listed under item 1.

### 2. Bengali speaker count — FIXED

Harmonised to "about 240 million" across both posts. Published estimates run
237–242 million total speakers, so a rounded figure is defensible where an
exact one would be false precision.

- `building-ai-in-bengali-…` frontmatter `description`
  - Before: "Bengali has **234 million native speakers** and a fraction of a percent of AI training data."
  - After: "Bengali has **about 240 million speakers** and a fraction of a percent of AI training data."
- `building-ai-in-bengali-…` body
  - Before: "This has significant consequences for the **234 million people who speak it as their first language**, and the AI industry has not adequately confronted it."
  - After: "This has significant consequences for **about 240 million people who speak it**, and the AI industry has not adequately confronted it."
  - The qualifier "as their first language" was dropped because the new figure
    counts total speakers, not native speakers. Keeping it would have
    relabelled one statistic as another.
- `the-data-gap-…` body
  - Before: "with **approximately 230 million** speakers globally."
  - After: "with **about 240 million** speakers globally."

Untouched nearby: "Bengali accounts for approximately 3.1 percent of the
global population by native speakers, according to Ethnologue" — a different
statistic with its own citation.

### 3. Stale launch language — FIXED, by note rather than edit

An italic editor's note now opens the honeybee post, directly beneath the
byline. The original prose below it, including "We are pre-launch" and
"Launching April 2026", is unchanged: the post is a time capsule, and the note
makes that explicit instead of leaving it to read as an error.

- Added: "_Written March 2026, before launch. Hafsa Sastho enters public
  release on Google Play September 1, 2026._"

### 1. Data-gap citations — FIXED against the canonical set

The hold was lifted with a verified reference set. Each claim in the post was
classified antenatal or postpartum, then matched to the paper that reports it.
Where a prevalence figure in the prose matched one study's finding, that
settled the attribution.

**In-text, claim 1 — postpartum prevalence, 22 percent.** The figure matches
the Matlab cohort exactly, so the attribution follows it.

- Before: "A landmark study by Gausia et al. (**2007**), conducted **across multiple districts** in Bangladesh and published in the **_British Journal of Psychiatry_**, found postpartum depression rates of approximately 22 percent using validated screening instruments."
- After: "A landmark study by Gausia et al. (**2009**), **a community-based cohort in the rural subdistrict of Matlab** published in **_Psychological Medicine_**, found postpartum depression rates of approximately 22 percent using validated screening instruments."
- The study descriptor changed with the citation. The correct paper is a
  single-subdistrict cohort, so leaving "across multiple districts" would have
  attached a true citation to a false description of it.

**In-text, claim 2 — 18 percent, with poverty and intimate-partner-stress risk
factors.** Both the figure and the risk-factor profile belong to the antenatal
study, not a postpartum one. The sibling post describes the same study as
"during pregnancy", which corroborates the classification.

- Before: "A subsequent population-based study by Nasreen et al. (2011), published in **_BMC Pregnancy and Childbirth_**, documented **rates of 18 percent in rural communities**, with rates significantly higher among women experiencing poverty, intimate partner stress, or lack of social support."
- After: "A subsequent population-based study by Nasreen et al. (2011), published in **_BMC Women's Health_**, documented **depressive and anxiety symptoms during pregnancy affecting approximately 18 percent of women in rural communities**, with rates significantly higher among those experiencing poverty, intimate partner stress, or lack of social support."
- "during pregnancy" was added because the sentence sat in a paragraph about
  postpartum depression. Attaching the antenatal paper without it would have
  left the post asserting something that paper does not report.

**In-text, claim 3 — EPDS Bangla validation.** Already correct: "(Gausia et
al., 2007)" maps to the _Journal of Reproductive and Infant Psychology_ entry.
No change. Cox, Holden and Sagovsky (1987) was likewise already correct.

**Reference list** — one initial corrected, one entry added, one entry
corrected.

- `Gausia, **Q.**, …(2007)` → `Gausia, **K.**, …(2007)`
- Added, now that the 22 percent claim cites it: "Gausia, K., Fisher, C., Ali,
  M., and Oosthuizen, J. (2009). Magnitude and contributory factors of
  postnatal depression: A community-based cohort study from a rural
  subdistrict of Bangladesh. _Psychological Medicine_, 39(6), 999–1007.
  doi:10.1017/S0033291708004455"
- `Nasreen … (**2010**) … _BMC Women's Health_, **10(1), 1–8**` →
  `Nasreen … (**2011**) … _BMC Women's Health_, **11, 22**`

The three remaining papers in the canonical set — Gausia, _Archives of Women's
Mental Health_ 2009; Nasreen, _Journal of Depression & Anxiety_ 2015; Edhborg,
Nasreen and Kabir, _Archives of Women's Mental Health_ 2011 — are not cited by
this post and were not added. A reference list should carry what the text
cites and nothing else.

#### Two consequences held for a ruling

**(a) The derived figure downstream is now mis-scoped.** The paragraph after
the corrected citations reads: "even the lower end of the documented
prevalence range implies that 700,000 or more women experience clinically
significant **postpartum** depression every year." That range is now 18 percent
antenatal to 22 percent postpartum, so a figure derived from its lower bound
is not a postpartum figure. The sibling post makes the same derivation and
calls it "**perinatal** depression", which is the wording that would resolve
this. Changing it alters a claim, so it is held rather than applied.

**(b) The sibling post disagrees with the canonical set in two places.** This
task was scoped to the data-gap post, so `postpartum-depression-without-a-word-for-it`
was left alone, but against the verified references it now carries:

- Gausia, _Psychological Medicine_ 2009 with `doi:10.1017/S0033291708003927`;
  the canonical DOI is `10.1017/S0033291708004455`. The two posts now cite the
  same paper with different DOIs.
- Nasreen, _BMC Women's Health_ as `(2010) … 10(1), 12,
  doi:10.1186/1472-6874-10-12`; the canonical entry is 2011;11:22.
- Separately, that post contains an uncited claim — "Nasreen et al. examined
  the relationship between maternal mental health during pregnancy and birth
  outcomes … increased risk of low birth weight" — which does not map
  unambiguously to any of the six papers. Held, not guessed.

### 4. Named competitors — NO CHANGE, by design

A signed founder essay may name and compare other companies' products; an
automated surface answering as the company may not. The asymmetry is
deliberate, and the chat assistant's system prompt now says so explicitly: it
must not quote, summarise or repeat a competitor comparison from anything we
have published, even when asked about a post by name. It points at the post
instead.

---

## Flagged for founder review — not changed

These were the findings as they stood at migration, kept for the record.
Every one has since been ruled on: items 1, 2 and 3 were fixed and item 4 was
resolved as no-change. See the rulings above for what changed and for the two
questions the citation work left open.

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
