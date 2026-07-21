## Redesign roadmap (phased)

You picked "Everything, phased" + keep light purple + hamburger for deep modules. I'll ship one phase per turn so nothing that works today breaks silently. This plan is Phase 1; later phases follow the same pattern.

### Phase 1 — Shell, Home, Design system (this turn)

**Design tokens (`src/styles.css`)**
- Introduce a real type scale (display / h1 / h2 / body / caption) with consistent line-heights.
- Introduce a real spacing scale (`--space-1 … --space-12`) so pages stop inventing paddings.
- Introduce a single elevation scale (2 levels only) and remove nested-glass shadow stacking.
- Keep the light purple palette; nudge contrast so body text passes AA on the aurora background.
- Add a `.container-page` utility so every page has the same max-width and horizontal rhythm.

**Navigation (`src/components/nav.tsx` + `__root.tsx`)**
- Bottom tabs cut to **4**: Home · Tarot · History · Profile.
- New hamburger sheet on every screen (mobile + desktop) that opens the full 40-module catalog, grouped and searchable. Sidebar becomes hamburger-triggered only — no more permanent 256px sidebar eating desktop width.
- Desktop layout collapses to a centered container (max-w-6xl) instead of `pl-64`.

**Home (`src/routes/index.tsx`)**
- Strip the 3 module grids (24 tarot tiles) → replaced by a single "Quick Actions" row (Tarot · Kundli · Panchang · AI).
- Above it: greeting + one primary CTA ("Start a Reading") + today's date.
- Below it: "Today" glance (sun sign · moon · nakshatra), then "Recent" (last reading if any), then "Explore all modules →" link that opens the hamburger catalog.
- Remove the celestial mandala backdrop from home (it's decorative noise on first paint).

**Routing bug fix**
Console shows `Could not find match for matchId "//"`. Audit `<Link to="…">` calls with empty or trailing-slash paths and fix them.

### Phase 2 — Reading flow (next turn)
Tarot flow: choose type → shuffle → reveal → interpret, no intermediate screens. Simplify canvas UI, remove duplicate deck selectors, one-tap spread switching.

### Phase 3 — Module pages pass (next)
Apply the new design tokens to Kundli / Panchang / Numerology / Compatibility / AI — remove nested cards, cut duplicate CTAs, one heading per page.

### Phase 4 — Date service + perf pass (last)
Central `src/lib/date.ts` with UTC storage / local display helpers, replace every ad-hoc `new Date(str)`. Route-level code splitting audit, memo audit, image lazy loading. You never described the specific date symptom so I'll fix the general timezone drift across birth-date storage + panchang day boundaries; if you have a specific repro, drop it before Phase 4.

### What stays

- All existing modules and their data (I'm redesigning the shell, not deleting features).
- Light purple palette + gold accents.
- Author's note flow.
- Admin panel, auth, subscription gate, all backend behavior.

### Technical notes

- Files touched in Phase 1: `src/styles.css`, `src/routes/__root.tsx`, `src/components/nav.tsx` (rewritten), `src/routes/index.tsx` (rewritten), one new `src/components/module-catalog.tsx` for the hamburger sheet.
- No DB migrations. No new dependencies.
- No changes to `_authenticated/*` or the 40+ module routes yet — Phase 3.

Reply "go" to run Phase 1, or tell me what to change.
