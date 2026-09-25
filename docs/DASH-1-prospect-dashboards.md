# DASH-1 · Prospect dashboards

> Template 1, frozen with EckCo. New pages use template 2: see `docs/DASH-2-template-2.md`.

A prospect dashboard is the page a mailed letter's P.S. points to. It is the
letter, continued: one scrolling page, no navigation, the model's assumptions
as sliders, the public series behind the argument, and one way to book.

## Addresses

- Short address, printed in the letter: `nahltech.com/<slug>` (for example `/eckco`).
- It redirects (307, deliberately not permanent) to `nahltech.com/m/<token>`.
- Tokens come from the prospect book and never change, so a printed code keeps working.

## Adding a company

1. Copy `content/dashboards/eckco.json` to `content/dashboards/<slug>.json`.
2. Replace every field. The schema in `src/lib/dashboards/schema.ts` is the contract;
   a config that does not satisfy it fails the build with the file name in the error.
3. `npm run test:run`. The dashboard tests check the schema, unique slugs and tokens,
   that the slug does not shadow a site route, that the formula is monotone in every
   input, and that no banned word appears.
4. `npm run build`, then open `/m/<token>?preview` locally (`?preview` skips the visit count).

Nothing else changes. No component names a company.

## Writing a config

- **Labels.** Put `[[OBSERVED]]`, `[[BENCHMARK]]` or `[[ASSUMED]]` directly after the
  figure it qualifies, in any prose field. Every number on the page carries one.
  OBSERVED is only for facts read from the company's own public record. BENCHMARK is
  only for a named, dated public series. Everything we estimated is ASSUMED.
- **Sliders.** One to four. Each is a band from `min` to `max`, and those must be the
  exact ranges printed in that company's letter; the page opens at them. Formats:
  `usdMillions`, `usd`, `percent` (entered as 2 for 2 percent), `multiple`, `count`, `minutes`.
- **Formula.** Plain arithmetic over slider and constant ids: numbers, names,
  `+ - * /` and parentheses. The headline range is taken from the corners of the
  slider box, which is only valid when the model rises or falls steadily in each
  input. The monotonicity test enforces it.
- **letterRange.** The range printed in the letter. The headline and the readout show it
  exactly until the visitor moves a slider; after that they show the model's live output,
  with a note when it falls outside the letter's range. Before printing a letter, check that
  the model's full span at the letter's slider ranges rounds to the printed range. If it does
  not, fix the letter or the model, not the page: a visitor who drags every handle to the top
  of the printed ranges will see the model's true figure.
- **Proposal.** `lead` is the letter's proposal paragraph, verbatim. The deliverables, week
  shape, fee and conversion line expand it; `ledger` is an optional illustrative fragment and
  must keep a label saying it is not the company's data.
- **Findings.** At most three, teaser depth: the figure and one or two honest paragraphs.
  `closing` is appended to each. Never publish the working, the family models, the
  pipeline, or rung two and three designs.
- **Charts.** `line` for a monthly series, `bars` for a small comparison. Every chart
  names its source and the release date in `source`.

## Measurement

The only measurement is a tally: `/api/visit` stores the token and a timestamp in
`dashboard_visits`, on production only, and nothing that identifies a visitor. The
beacon stands down under Global Privacy Control, Do Not Track and `?preview`.
GA4, pixels and retargeting are never added to these pages. The letters promise
that no one will call because the reader visited, and that promise is binding.

To read the tally (service role, in the Supabase SQL editor):

```sql
select token, count(*) as visits, min(visited_at) as first, max(visited_at) as last
from public.dashboard_visits group by token order by last desc;
```
