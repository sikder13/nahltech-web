# DASH-2 · Prospect dashboards, template 2

## Two templates, and why

The EckCo page shipped with a printed letter on September 24, 2026. A shipped page is never changed: the letter in the prospect's hand describes it as it is. So the dashboard code exists twice.

| | Template 1 (frozen) | Template 2 |
|---|---|---|
| Pages | EckCo | Mursix, and every company after it |
| Address | `/m/<token>` | `/m2/<token>` |
| Configs | `content/dashboards/` | `content/dashboards-v2/` |
| Code | `src/lib/dashboards/*.ts`, `src/components/dashboard/*`, `src/app/m/` | `src/lib/dashboards/v2/`, `src/components/dashboard/v2/`, `src/app/m2/` |
| Visit count | `/api/visit` | `/api/visit2` (skips crawlers and automated browsers) |

Template 1 is enforced two ways. `src/lib/dashboards/eckco-frozen.test.ts` pins every file EckCo is built from to the bytes that shipped. `npm run check:eckco-frozen` runs in CI after the build and compares the rendered EckCo page with `tests/golden/eckco-body.html`, captured from production. Never edit template 1. If a change to a shipped page is ever deliberate and approved, update the pin and the golden file in the same commit and say so in its message.

The same rule applies from here on: once a page has gone out with a letter, it stays as it is. New features land in the current template only. When template 2 pages have shipped and the next round of features arrives, start template 3 the same way.

## What template 2 adds

- The model is a sum of named terms (`model.terms`). The formula box shows each term's live range and the exact total ("Computed"), beside the headline rounded to `roundTo`.
- A how-to-read line states the rounding rule.
- Sliders can open on a `rest` band narrower than the track (the letter's range, while the track can reach zero), carry a `caption`, and offer one-tap `presets`.
- Tapping a slider's value opens exact entry. Typed figures are kept exactly and clamped to the track.
- `points` charts: two dated readings, no line between them, a dimension bracket for the change, and computed points drawn hollow with their note.
- Optional `respect` section and `market.notes`; `findings` is optional.
- A print stylesheet. The screen reader hears the estimate once per interaction, not on every step.

## Fields added after Mursix shipped (all default-off)

Every one is optional and absent from `content/dashboards-v2/mursix.json`, so the Mursix page renders byte for byte as it shipped, which `npm run check:mursix-frozen` enforces in CI against `tests/golden/mursix-body.html` (React's generated aria ids are normalized there; their wiring is verified on the real ids by the pairing check inside both gate scripts).

- `model.spans`: observed fixed ranges (a posted price span) that term formulas read. Not sliders; corner evaluation pairs low with low.
- `model.unit`: the suffix after the headline figure ("per hundred cabs"). Absent, the shared per-year suffix renders.
- `model.volume`: an optional field where the reader types a yearly volume; every figure scales as round-to-step of the EXACT scaled value, one rounding, last (`displayedAtVolume`).
- Slider format `months`: a plain number; the label carries the unit.
- `proposal.ledger.dense`: tighter phone-width ledger gutters for wide word columns.
- `proposal.promise`: a standing promise printed under the conversion clause.
- `formatUsdExact` prints true cents when a figure is fractional, rounded half up on the decimal value; whole-dollar figures render as before.
- `npm run check:no-github` fails the build if any rendered dashboard page carries a github.com href.

## Adding a company

Copy `content/dashboards-v2/mursix.json` to `content/dashboards-v2/<slug>.json`, replace every field, run `npm run test:run` and `npm run build`, and open `/m2/<token>?preview`. The tests require that the model's full span at the letter's printed assumptions rounds to exactly the range printed in the letter.
