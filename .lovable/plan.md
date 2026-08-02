# Vedic Numerology + Kabbalah Numerology — premium rebuild

Two distinct products inside TAROMAYA, each with its own shell, look and navigation. Both reuse the existing calculation engines (`src/lib/numerology*.ts`, `src/lib/loshu/*`, `src/lib/kabbalah-tarot.ts`) so numbers stay accurate, and both use the single mic + one-textbox input pattern already in `universal-input.tsx` / `birth-one-box.tsx`.

Note on the request: Flutter/Firebase/Riverpod/biometrics/push notifications/UPI aren't available here — this is a web app on Lovable Cloud. I'll deliver the same experience as an installable, mobile-first responsive web app (bottom tab bar, haptics, offline cache, cloud sync via the backend, PDF export). Native-only items are out of scope.

## Phase 1 — Vedic Numerology shell + Home dashboard
- New route group `/vedic` with a mobile bottom nav: Home, Calculator, Reports, Remedies, Profile (desktop turns it into a top rail).
- Design tokens: white/ivory base, gold + deep navy accents, glass cards, 22-28px radii, 250-350ms motion, full light/dark support. All values as semantic tokens in `src/styles.css`.
- Home dashboard: greeting, active profile, live date/time, personal + universal day/month/year numbers, lucky number/colour/direction/time/planet, current Mahadasha + Antardasha, daily advice, motivation, quick summary.
- Quick-action grid linking every sub-module.

## Phase 2 — Profiles + core calculators
- Unlimited profiles in the backend (name, gender, DOB, birth time, place, email, phone, address, photo, notes, tags) with search, favourite, archive, duplicate, delete, import/export.
- One mic-driven text box per module; everything parsed from that single input.
- Calculator screens covering the full list: driver, conductor, destiny, psychic, life path, expression, soul urge, personality, maturity, attitude, challenge, karmic, pinnacle, essence, balance, hidden passion, rational thought, plus personal/universal cycles — each with step-by-step working shown.

## Phase 3 — Vedic sub-modules
- Lo Shu grid (extends existing module): heatmap, tap-to-explain cells, planes, arrows of strength/weakness, energy + personality balance.
- Name, Mobile, Business, Vehicle, House numerology, each with its own scoring, planet influence, suggestions and remedies.
- Relationship compatibility (marriage, love, friendship, business, parent-child) with score, strengths, challenges, growth areas.
- Mahadasha module: Maha/Antar/Pratyantar timeline + calendar view.
- Remedies engine and Lucky Calendar (lucky/avoid dates by purpose).
- Per-number interpretation library covering the full attribute list.

## Phase 4 — Kabbalah Numerology platform
- Separate light-only shell at `/kabbalah` (ivory #FAF8F4, white, gold #D4AF37, charcoal #222, serif headings + sans body, sacred-geometry background at 3-5% opacity) with nav: Home, Sephirot, Calculator, Tree of Life, Interpretation, Learn, History, Profile, Settings.
- Home: large sacred number, path name, Neshamah/Ruach/Nefesh/Yehud cards, today's insight, recent + favourite calculations.
- Interactive scalable Tree of Life: 10 Sephirot, golden paths, glow on select, tap into detail.
- Sephirot database: all 10 with the full attribute set (Hebrew name, planet, element, colour, virtue, vice, body, chakra, balanced/blocked, healing, practices, prompts).
- Hebrew letter database: all 22 letters with value, meaning, element, planet, qualities.
- Calculator with visible letter-by-letter working (letter, Hebrew equivalent, value, running total, reduced) and all soul/personality/expression/mission/Tikun outputs.

## Phase 5 — Reports, AI, learning, settings
- Premium PDF reports for both products: cover page, charts, grid/tree visuals, interpretations, remedies, action plan; share/print/download; saved + favourited in the backend.
- Cross-referencing AI interpretation for both products (blends all numbers, detects dominant/conflicting/missing energies) in the existing three languages: English, Hindi, Hinglish.
- Learning academies for both, with lessons, case studies and quizzes.
- Settings: theme, language, backup/restore, cloud sync, privacy, PIN lock.
- Global search across profiles, reports, numbers, Sephirot, letters, lessons.

## Technical notes
- Routes under `src/routes/vedic/*` and `src/routes/kabbalah/*`; profile/report persistence via new tables with RLS scoped to `auth.uid()` and explicit GRANTs.
- Interpretation content lives in data modules (`src/lib/vedic-num/*`, `src/lib/kabbalah/*`) so it stays translatable and testable; engines get unit tests.
- Language stays locked to English / Hindi (Devanagari) / Hinglish per existing project rules — the extra regional languages listed in the brief are not added.

I'll build phase by phase and check in after each so you can review before I continue.
