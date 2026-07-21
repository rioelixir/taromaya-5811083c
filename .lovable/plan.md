# Taromaya Master Overhaul — Execution Plan

The prompt covers 15 phases. Trying to ship all of them in one turn produces shallow changes everywhere and regressions. I'll batch by user-visible impact, ship each batch fully verified, then move to the next.

Where we already are (recent turns): Kundli UI fixed, Dasha/Panchang/Vargas verified, Tarot rebuilt with strict deck modes + CSPRNG, Numerology audit (Chaldean + Pythagorean) with karmic-debt coverage + compound numbers, a11y clean, tests green.

## Batch A — AI quality + accuracy (Phases 2, 3, 9)
The single biggest lever for "feels like $10M".
1. Rewrite the master AI prompt (`ai_prompts` table + `src/routes/api/ai-reading.ts`) to require: Summary → Detailed Analysis → Planetary Reasoning → Supporting Houses/Yogas/Dasha → Current Transit Effect → Confidence Score → Recommended Actions → Avoid → Best Dates → Lucky Colors/Numbers → Remedies → Spiritual Guidance. ELI10 tone preserved.
2. Feed every AI call the user's real chart context (Lagna, Moon, Sun, current Mahadasha/Antardasha, active transits, nakshatra+pada, dominant yogas/doshas) from the private profile — not just name+DOB.
3. AI Chat (`/ai-guide`): add conversation memory (send full history), astrology-grounded system prompt, follow-up prompting, and citation of chart factors.
4. Add a `confidence` field surfaced in the UI.

## Batch B — Module completeness sweep (Phases 4, 10, 15)
Walk every route in `src/routes/`, fix broken/empty states, ensure each has: birth autofill → calculation → chart → AI interpretation → remedies. Replace any remaining placeholder copy. Add error boundaries + retry on every loader.

## Batch C — Premium features (Phase 13)
- PDF export polish across all reports (already have quota).
- Share report links (public read via `TO anon` on a `shared_reports` table with random slug + expiry).
- Transit Calendar route.
- Saved bookmarks table + UI.
- Push notifications (browser Push API) opt-in for daily horoscope.

## Batch D — Perf, security, tests (Phases 6, 8, 11, 12)
- Lazy-load heavy chart components; preload LCP hero.
- Run `security--run_security_scan`; fix findings.
- Add Vitest coverage for `vedic.ts`, `panchang.ts`, `numerology.ts`, `tarot-deck.ts`.
- TypeScript strict pass; remove dead code.

## Out of scope this pass (needs your input)
- Payments/subscription pricing changes (Phase 4 payments) — you already set fixed admin pricing; leave as-is unless you say otherwise.
- Voice reading + full multilingual expansion beyond current EN/HI/Roman — heavy scope, propose as a later batch.
- Analytics tracking (Phase 14) — needs a provider choice (PostHog vs. built-in Supabase logging).

## Recommended start
**Batch A first.** It's the phase that most directly changes how the app "feels" and is the one every other module depends on (every module page renders an AI interpretation). One turn = new prompt schema + chart-context injection + AI chat memory + confidence field.

Reply **A**, **B**, **C**, or **D** to pick a batch, or name specific phases to prioritize differently.
