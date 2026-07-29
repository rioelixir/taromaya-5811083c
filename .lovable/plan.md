## First, one thing I could not do

**Lovable badge (item 11):** hiding it is a paid-plan feature. The tool refused with "requires an editor role on a Pro plan or higher". Once the workspace is on Pro, I can turn it off in one click. There is no Lovable badge inside your own code — it is injected by hosting only on the published site.

## Scope reality

The remaining 18 items are roughly a month of product work: a worldwide country/state/city database, 30+ language translations, two full numerology engines, an AI Nakshatra auto-pull, a board rework, plus a plain-English rewrite of every page in the app. Shipping it as one giant blind change would very likely break tarot, kundli and the saved-chart data that already works. I will do all of it, but in ordered batches so each one is verifiable.

## Batch 1 — Bugs and board (highest impact, do first)

- Fix the zoom-close bug: closing a zoomed card must never navigate, reload or reset the spread. Audit every module that opens an overlay (tarot, oracle/healing decks, nakshatra, reports, freestyle boards) and make all overlays pure local state with no route change and no key remount.
- Deck names on the board: bigger, bolder, higher contrast, readable at 320px.
- Remove the always-on AI interpretation panel from the tarot board and replace it with an **ASK AI** button that returns 5-7 lines of simple English based on the drawn cards, their positions, the spread and the question.

## Batch 2 — Location and time

- Replace the numeric UTC-offset field everywhere with Country → State → City.
- Timezone, UTC offset and DST are resolved automatically from the chosen city and used internally for all calculations; the user only ever sees friendly labels like "India Time" or "New York Time".
- Remove the manual house-system picker from the user-facing flow (calculations keep using the correct system internally).
- Worldwide coverage, not India-only.

## Batch 3 — AI Nakshatra module

- Rebuild the screen to ask only for a place.
- Compute the live Moon longitude, current nakshatra and pada, match the exact card in the Nakshatra deck, and slide that card onto the board automatically with a smooth animation.
- Show nakshatra, pada, card number, card name and a short simple-English meaning.

## Batch 4 — Numerology

- Vedic module: birth, destiny, name, soul, personality, karmic numbers; lucky numbers/days/colours/direction; friend, enemy, business, marriage, career, health numbers; compatibility; personal year/month/day; year and month prediction; remedies; full report.
- Western module: life path, expression, soul urge, birthday, personality, maturity, hidden passion, balance, challenges, pinnacles, cycles, essence, transits, compatibility, year and month forecast, career, relationships, money, health, full report.
- Every value comes from a real formula with unit tests — no placeholders, no random output.

## Batch 5 — Language and wording

- Plain-English pass over every page: Meaning instead of Interpretation, Create Birth Chart instead of Generate Horoscope, Reading instead of Consultation, Rising Sign instead of Ascendant, Start instead of Commence, and so on across all copy.
- Extend the language switcher to the full Indian + global list you gave.

## Batch 6 — Mobile, performance, QA

- Responsive audit at 320 / 375 / 768 / 1280: no overlap, no clipped cards, no hidden buttons.
- Reduce refetching and remounts, lazy-load card art, cache chart calculations.
- Test pass across modules, spreads, zoom behaviour, languages and devices.

## Technical notes

- City data ships as a bundled dataset with IANA timezone ids resolved via `Intl.DateTimeFormat` so DST is handled by the runtime, not hardcoded tables. Saved charts keep storing the resolved numeric offset so existing rows stay valid.
- Overlay state moves to component state with stable React keys; no `router.navigate` in any close handler.
- Numerology lives in pure functions in `src/lib/` with vitest coverage; the AI layer only phrases the already-computed numbers, never invents them.
- Translation uses the existing translate route, with a static dictionary for UI chrome so switching languages does not cost an AI call per label.

## What I need from you

Reply "go" and I will start with Batch 1 immediately and work down the list, or tell me a different order if something else is more urgent.
