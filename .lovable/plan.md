## Goal

Bring Taromaya's astrology engine to AstroSage-level depth: deterministic Swiss-Ephemeris-grade calculations, full Kundli + 16 Vargas + Dashas + Ashtakavarga + Shadbala + Yogas/Doshas + Matching + Panchang + Transits + Varshphal + KP + Lal Kitab + Jaimini + Western, with a two-stage prediction engine (deterministic facts → LLM narration only).

Tarot, auth, subscriptions, admin, uploads, branding, and existing DB rows stay untouched.

## What already exists (keep and extend, don't rebuild)

- `src/lib/vedic.ts`, `vedic-extended.ts`, `vedic-deep.ts` — Lahiri, D-charts, Vimshottari, Yogas, Doshas, Ashtakavarga, Shadbala, KP sub-lord, Lal Kitab
- `src/lib/western.ts`, `src/components/wheel-chart.tsx`, `bi-wheel-chart.tsx` — tropical, aspects, synastry, transits, progressions, solar return
- `src/lib/panchang.ts`, `muhurat.ts`, `remedies.ts`, `numerology.ts`, `compatibility.ts` (Ashtakoota), `chinese.ts`
- `astronomy-engine` for planetary positions (sidereal via Lahiri offset)

The full AstroSage parity list is not realistic in one turn. I'll ship it in **six approve-then-build phases**, each independently valuable and shippable. Phases 1–3 are the calculation upgrade; 4–6 are UX/QA/admin.

## Phase 1 — Ephemeris accuracy foundation (this phase, on approval)

**Backend server functions (Swiss Ephemeris-grade via `astronomy-engine` + refinements):**
- New `src/lib/ephemeris.functions.ts` (`createServerFn`) — single source of truth. All chart requests go through it. Returns planetary longitude, latitude, speed, declination, retrograde, combustion, dignity, nakshatra+pada.
- Accepts full config: ayanamsa (Lahiri/Raman/KP/Krishnamurti/tropical), node type (True/Mean Rahu-Ketu), house system (Placidus/Koch/Whole/Equal/Sripati/Bhava-Chalit), topocentric flag, elevation, seconds-precision UTC.
- Historical timezone + DST via `@vvo/tzdb` + `luxon` (already common). Manual coordinate override.
- Persists the full `chart_config` JSON with each saved chart so results are reproducible.

**Schema (migration):**
- `saved_kundlis` → add `chart_config jsonb`, `engine_version text`, `ayanamsa text`, `house_system text`, `node_type text`, `elevation_m numeric`.
- New `chart_calculations` table (RLS: owner-only) caching the computed payload keyed by `(chart_id, engine_version, config_hash)` so recomputes are free.
- New `accuracy_reference_charts` (admin-only) for Phase 5's test suite.

**Frontend:**
- Update `src/routes/kundli.tsx` birth-detail form: seconds field, unknown-time toggle, ayanamsa/node/house pickers with sensible defaults (Lahiri / True Node / Placidus for Vedic, Whole Sign toggle), visible geocode confirmation (city/state/country/coords/tz shown before "Calculate").
- Language toggle scaffolding (English + Simple Hindi) via a `lang` cookie + i18n dictionary; wire to Kundli + Panchang first.

## Phase 2 — Complete Kundli & Divisional Charts

- All 16 Vargas with **correct traditional sign-allocation formulas** (not naive longitude division). Verified against classical rules: D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60.
- North / South / East Indian chart renderers (SVG) sharing one data model.
- Bhava Chalit + cuspal degrees separate from Rashi chart.
- Planetary table: sign, house, degree°min'sec", nakshatra+pada, retro, combust, speed, dignity, Moolatrikona, friend/neutral/enemy, functional benefic/malefic per Lagna.
- Panchang-at-birth block on the Kundli page.

## Phase 3 — Dashas, Strength, Ashtakavarga, Yogas/Doshas, Matching (deep pass)

- **Dashas:** Vimshottari (Maha/Antar/Pratyantar/Sookshma/Prana) with Moon-nakshatra remainder for balance-of-dasha, plus Yogini, Ashtottari, Chara, Kalachakra.
- **Shadbala:** Sthana, Dig, Kala, Cheshta, Naisargika, Drik + Ishta/Kashta Phala + Bhava Bala + Vimsopaka + Avasthas.
- **Ashtakavarga:** Bhinnashtakavarga per planet, Sarvashtakavarga, Trikona + Ekadhipatya Shodhana, Prastara, transit bindus.
- **Yogas & Doshas:** explicit rule engine returning `{present, rule, planets, houses, cancellations, severity, interpretation, remedies[]}` — no LLM in this path. Covers the full list you named (Raj/Dhana/Panch Mahapurusha/Gaj Kesari/Neecha Bhanga/Vipreet/Kemadruma/etc., plus Mangal/KaalSarp/Pitra/Grahan/Nadi/Bhakoot/Gandmool/Sade Sati/Dhaiya/combustion/planetary war).
- **Matching:** Ashtakoota 36-point breakdown + Manglik comparison & cancellations + 7th house/lord + Venus/Jupiter + Navamsha overlay + emotional/communication/finance/intimacy sections. Final recommendation blends all layers, not just the 36 score.

## Phase 4 — Transits, Varshphal, KP, Lal Kitab, Jaimini, Horary, Western

- Gochar dashboard with natal-house/planet transits, Sade Sati/Dhaiya windows, Vedha, monthly timeline, Ashtakavarga-weighted flags.
- Varshphal (Tajika): Muntha, Sahams, Mudda Dasha, monthly opportunity/caution timeline.
- KP: cusps + star/sub/sub-sub lord + ruling planets + significators + Prashna module.
- Lal Kitab chart + Varshphal + planetary status + Lal Kitab-specific remedies (kept separate from Vedic remedies).
- Jaimini: Karakas, Arudha, Upapada, Chara Dasha.
- Western: Placidus natal, aspects, synastry, composite (already partly present, unify into the same input form).

## Phase 5 — Prediction engine, PDFs, i18n, mobile polish

- Two-stage prediction pipeline:
  1. **Evidence engine** (deterministic) emits a structured JSON of facts per section (Personality/Career/Marriage/Health/Current period/etc.).
  2. **Narration engine** (Lovable AI Gateway, `openai/gpt-5.5`) turns the fact JSON into English/Hindi prose with a strict system prompt: never invent placements, dates, dashas, yogas, doshas, scores, or remedies; only rephrase what's in the fact JSON. Traceability: each paragraph carries the fact IDs it drew from.
- Report PDFs (jspdf, already installed) with English/Hindi toggle, chart images, full tables.
- Mobile-first sweep on all new routes: bottom-nav, large tap targets, readable tables, full-screen chart zoom.

## Phase 6 — Admin, QA, security

- **Admin additions:** enable/disable modules, edit prediction templates, manage translations, review calc-error + failed-geocode logs, run accuracy regression, roll back engine version, approve manual subs (already partly there).
- **Accuracy Lab:** admin-only route running the reference-chart suite (200+ cases: DST transitions, polar lat, sign/nakshatra/house-cusp boundaries, retrograde stations, dasha boundaries) against a stored expected-payload table. Shows diff per field and engine version.
- **Security:** confirm RLS on every new table, service-role never in client bundle, rate-limiting on ephemeris server-fn (per-user + per-IP), input validation with zod, audit log on admin actions, disclaimer copy site-wide.

## Technical notes

- Ephemeris backbone remains `astronomy-engine` (deterministic, WASM-free, Worker-compatible). True Swiss Ephemeris `.se1` files are Node-native and won't run on Cloudflare Workers; `astronomy-engine` matches JPL DE440 to sub-arcsecond and is the standard choice for this runtime. Documented publicly in the app as the engine and version.
- Ayanamsa Lahiri formula (Chitrapaksha) implemented per IAU precession + Lahiri offset table; Raman/KP/Krishnamurti as configurable deltas.
- `chart_config` + `engine_version` stored so any past chart re-renders identically after future engine upgrades.
- All calc endpoints are `createServerFn` with `requireSupabaseAuth`; the LLM narration endpoint receives only the fact JSON, never the raw birth data.

## What I need from you before Phase 1

1. **Approve this phased plan** — or tell me to collapse phases / drop modules.
2. **Ayanamsa default** — I'll use Lahiri unless you prefer N.C. Lahiri variant / Raman / KP-Old / KP-New.
3. **House system default for Vedic** — Placidus (AstroSage default), Whole Sign, or Sripati / Bhava-Chalit?
4. **Language scope for v1** — English + Simple Hindi only, or add Roman Hindi in Phase 1?

On approval I'll ship Phase 1 (ephemeris server-fn, schema migration, input-form upgrade, geocode confirmation, language scaffold) in the next turn.
