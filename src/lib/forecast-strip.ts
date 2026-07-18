// Daily transit-intensity forecast strip.
// Aggregates aspect hits + stations + ingresses + eclipses into a per-day
// score with tonal bias (harmonious vs challenging). Feeds the Forecast
// Strip visualization on the Transits page.

import type { EclipseEvent, Ingress, Station, TimelineHit } from "./transits-timeline";
import type { AspectType } from "./western";
import type { PlanetName } from "./vedic";

export type DailyCell = {
  date: Date;             // 00:00 local of that day
  score: number;          // 0–100 intensity
  tone: number;           // -100 (hard) … +100 (soft)
  events: {
    hits: TimelineHit[];
    stations: Station[];
    ingresses: Ingress[];
    eclipses: EclipseEvent[];
  };
  label: string;          // headline event string
};

// How strongly each moving body colors the day.
const BODY_WEIGHT: Partial<Record<PlanetName, number>> = {
  Sun: 6, Moon: 3, Mercury: 5, Venus: 5, Mars: 8,
  Jupiter: 12, Saturn: 14, Rahu: 10, Ketu: 10,
};

// Aspect polarity & weight.
const ASPECT_WEIGHT: Partial<Record<AspectType, { w: number; tone: number }>> = {
  conjunction:      { w: 10, tone:   0 },
  opposition:       { w:  9, tone: -70 },
  square:           { w:  9, tone: -80 },
  trine:            { w:  7, tone: +80 },
  sextile:          { w:  5, tone: +50 },
  quincunx:         { w:  4, tone: -30 },
  "semi-sextile":   { w:  2, tone: +15 },
  "semi-square":    { w:  4, tone: -40 },
  sesquiquadrate:   { w:  4, tone: -40 },
  quintile:         { w:  3, tone: +30 },
};

function dayKey(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function buildDailyStrip(
  start: Date, end: Date,
  hits: TimelineHit[],
  stations: Station[],
  ingresses: Ingress[],
  eclipses: EclipseEvent[],
): DailyCell[] {
  const days: DailyCell[] = [];
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  for (let t = s.getTime(); t <= e.getTime(); t += 86400000) {
    days.push({
      date: new Date(t), score: 0, tone: 0, label: "",
      events: { hits: [], stations: [], ingresses: [], eclipses: [] },
    });
  }
  const idx = new Map(days.map((d, i) => [d.date.getTime(), i]));
  const nudge = (date: Date, wScore: number, wTone: number, kind: keyof DailyCell["events"], ev: unknown, headline: string) => {
    const i = idx.get(dayKey(date));
    if (i == null) return;
    const cell = days[i];
    cell.score += wScore;
    cell.tone += wTone;
    // @ts-expect-error union push
    cell.events[kind].push(ev);
    if (!cell.label || wScore > 8) cell.label = headline;
  };

  for (const h of hits) {
    const bw = BODY_WEIGHT[h.transit] ?? 5;
    const aw = ASPECT_WEIGHT[h.type] ?? { w: 3, tone: 0 };
    nudge(h.date, bw * 0.8 + aw.w, aw.tone * (bw / 10), "hits", h,
      `${h.transit} ${h.type} natal ${h.natal}`);
  }
  for (const st of stations) {
    const bw = BODY_WEIGHT[st.planet] ?? 6;
    nudge(st.date, bw + 8, st.kind === "retrograde" ? -35 : +20, "stations", st,
      `${st.planet} stations ${st.kind}`);
  }
  for (const g of ingresses) {
    const bw = BODY_WEIGHT[g.planet] ?? 4;
    nudge(g.date, bw + 4, 0, "ingresses", g, `${g.planet} → ${g.toSign}`);
  }
  for (const ec of eclipses) {
    nudge(ec.date, 30, -20, "eclipses", ec, `${ec.kind} eclipse (${ec.variety})`);
  }

  // Normalize to 0–100 scale (log-compress so a huge day doesn't flatten others).
  const max = Math.max(1, ...days.map((d) => d.score));
  for (const d of days) {
    d.score = Math.round(Math.min(100, (Math.log1p(d.score) / Math.log1p(max)) * 100));
    d.tone = Math.max(-100, Math.min(100, Math.round(d.tone)));
  }
  return days;
}

export function pickPeaks(strip: DailyCell[], count = 8): DailyCell[] {
  return [...strip].filter((d) => d.score > 0).sort((a, b) => b.score - a.score).slice(0, count)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
