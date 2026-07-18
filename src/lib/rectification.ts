// Birth-time Rectification Assistant.
// Given an approximate birth time and a list of dated life events, score a
// window of candidate birth minutes by how well solar-arc directions,
// secondary progressions, and outer-planet transits align with those events.
//
// Fully client-side — reuses computeWesternChart + progressedChart.

import { computeWesternChart, type WesternChart } from "./western";
import { progressedChart, type BirthInput } from "./progressions";
import type { PlanetName } from "./vedic";

export type EventCategory =
  | "career" | "marriage" | "childbirth" | "loss" | "move" | "education" | "health" | "spiritual";

export type LifeEvent = {
  id: string;
  category: EventCategory;
  date: string;   // YYYY-MM-DD
  label?: string;
};

// Which natal points each event category "cares" about most.
const CATEGORY_TARGETS: Record<EventCategory, { points: Point[]; weight: number }> = {
  career:     { points: ["MC", "Sun", "Saturn"], weight: 1.2 },
  marriage:   { points: ["ASC", "Venus", "Moon", "Descendant"], weight: 1.2 },
  childbirth: { points: ["Moon", "Venus", "Jupiter", "IC"], weight: 1.0 },
  loss:       { points: ["Moon", "Saturn", "Sun"], weight: 1.0 },
  move:       { points: ["IC", "Moon", "MC"], weight: 0.9 },
  education:  { points: ["Mercury", "Jupiter", "MC"], weight: 0.8 },
  health:     { points: ["ASC", "Sun", "Mars", "Saturn"], weight: 0.9 },
  spiritual:  { points: ["Sun", "Jupiter", "Neptune-proxy" as Point, "IC"], weight: 0.8 },
};

type Point = PlanetName | "ASC" | "MC" | "IC" | "Descendant" | "Neptune-proxy";

const HARD_ANGLES = [0, 90, 180];      // conj / square / opposition
const SOFT_ANGLES = [60, 120];         // sextile / trine
const HARD_ORB = 1.2;
const SOFT_ORB = 1.0;
const TRANSIT_ORB = 1.5;

const norm360 = (x: number) => ((x % 360) + 360) % 360;
function angDist(a: number, b: number): number {
  const d = Math.abs(norm360(a - b));
  return Math.min(d, 360 - d);
}

function pointLongitude(chart: WesternChart, p: Point): number | null {
  if (p === "ASC") return chart.tropicalAscendant;
  if (p === "MC") return chart.midheaven;
  if (p === "IC") return norm360(chart.midheaven + 180);
  if (p === "Descendant") return norm360(chart.tropicalAscendant + 180);
  if (p === "Neptune-proxy") return null; // not modelled — skipped
  const pl = chart.tropicalPlanets.find((pp) => pp.name === p);
  return pl ? pl.tropicalLongitude : null;
}

function bestAspectScore(a: number, b: number, angles: number[], maxOrb: number): number {
  const d = angDist(a, b);
  let best = 0;
  for (const ang of angles) {
    const orb = Math.abs(d - ang);
    if (orb <= maxOrb) {
      const s = 1 - orb / maxOrb;
      if (s > best) best = s;
    }
  }
  return best;
}

function shiftBirth(base: BirthInput, deltaMinutes: number): BirthInput {
  const ms = Date.UTC(base.year, base.month - 1, base.day, base.hour, base.minute) + deltaMinutes * 60000;
  const d = new Date(ms);
  return {
    ...base,
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

export function birthMinuteOffsetLabel(base: BirthInput, cand: BirthInput): number {
  const a = Date.UTC(base.year, base.month - 1, base.day, base.hour, base.minute);
  const b = Date.UTC(cand.year, cand.month - 1, cand.day, cand.hour, cand.minute);
  return Math.round((b - a) / 60000);
}

// Score a single candidate birth against all events.
function scoreCandidate(
  cand: BirthInput,
  events: LifeEvent[],
): { total: number; perEvent: { id: string; score: number; hits: string[] }[] } {
  const natal = computeWesternChart(cand, "placidus");
  const perEvent: { id: string; score: number; hits: string[] }[] = [];
  let total = 0;

  for (const ev of events) {
    const eventDate = new Date(ev.date + "T12:00:00Z");
    if (isNaN(eventDate.getTime())) {
      perEvent.push({ id: ev.id, score: 0, hits: [] });
      continue;
    }
    const cfg = CATEGORY_TARGETS[ev.category];
    const targets = cfg.points;
    let evScore = 0;
    const hits: string[] = [];

    // 1) Secondary Progressions at event date.
    const prog = progressedChart(cand, eventDate, "placidus");
    const progAsc = prog.chart.tropicalAscendant;
    const progMC = prog.chart.midheaven;
    const progMoon = prog.chart.tropicalPlanets.find((p) => p.name === "Moon")!.tropicalLongitude;
    const progSun = prog.chart.tropicalPlanets.find((p) => p.name === "Sun")!.tropicalLongitude;

    for (const t of targets) {
      const natLon = pointLongitude(natal, t);
      if (natLon == null) continue;
      const hardH = bestAspectScore(progAsc, natLon, HARD_ANGLES, HARD_ORB);
      const hardM = bestAspectScore(progMC, natLon, HARD_ANGLES, HARD_ORB);
      const softMoon = bestAspectScore(progMoon, natLon, [...HARD_ANGLES, ...SOFT_ANGLES], SOFT_ORB);
      const softSun = bestAspectScore(progSun, natLon, HARD_ANGLES, HARD_ORB);
      if (hardH > 0) { evScore += hardH * 3; hits.push(`prog ASC → natal ${t}`); }
      if (hardM > 0) { evScore += hardM * 3; hits.push(`prog MC → natal ${t}`); }
      if (softMoon > 0) { evScore += softMoon * 1.2; hits.push(`prog Moon → natal ${t}`); }
      if (softSun > 0) { evScore += softSun * 1.5; hits.push(`prog Sun → natal ${t}`); }
    }

    // 2) Solar Arc direction: shift every natal point by (progSun - natalSun).
    const natalSun = natal.tropicalPlanets.find((p) => p.name === "Sun")!.tropicalLongitude;
    const arc = norm360(progSun - natalSun);
    const arcAsc = norm360(natal.tropicalAscendant + arc);
    const arcMC = norm360(natal.midheaven + arc);
    const arcSun = norm360(natalSun + arc);
    for (const t of targets) {
      const natLon = pointLongitude(natal, t);
      if (natLon == null) continue;
      const sA = bestAspectScore(arcAsc, natLon, HARD_ANGLES, HARD_ORB * 0.8);
      const sM = bestAspectScore(arcMC, natLon, HARD_ANGLES, HARD_ORB * 0.8);
      const sS = bestAspectScore(arcSun, natLon, HARD_ANGLES, HARD_ORB * 0.8);
      if (sA > 0) { evScore += sA * 2.5; hits.push(`solar-arc ASC → ${t}`); }
      if (sM > 0) { evScore += sM * 2.5; hits.push(`solar-arc MC → ${t}`); }
      if (sS > 0) { evScore += sS * 1.5; hits.push(`solar-arc Sun → ${t}`); }
    }

    // 3) Transits: outer planets to natal angles on the event date.
    const eventChart = computeWesternChart(
      {
        year: eventDate.getUTCFullYear(),
        month: eventDate.getUTCMonth() + 1,
        day: eventDate.getUTCDate(),
        hour: eventDate.getUTCHours(),
        minute: eventDate.getUTCMinutes(),
        tzOffsetHours: 0,
        latitude: cand.latitude,
        longitude: cand.longitude,
      },
      "placidus",
    );
    const outers: PlanetName[] = ["Jupiter", "Saturn"];
    const anglePoints: Point[] = ["ASC", "MC"];
    for (const op of outers) {
      const tp = eventChart.tropicalPlanets.find((p) => p.name === op);
      if (!tp) continue;
      for (const t of anglePoints) {
        const natLon = pointLongitude(natal, t);
        if (natLon == null) continue;
        const s = bestAspectScore(tp.tropicalLongitude, natLon, [...HARD_ANGLES, ...SOFT_ANGLES], TRANSIT_ORB);
        if (s > 0) { evScore += s * 2; hits.push(`transit ${op} → natal ${t}`); }
      }
    }

    evScore *= cfg.weight;
    total += evScore;
    perEvent.push({ id: ev.id, score: evScore, hits: hits.slice(0, 4) });
  }

  return { total, perEvent };
}

export type RectificationCandidate = {
  birth: BirthInput;
  offsetMinutes: number;
  score: number;
  perEvent: { id: string; score: number; hits: string[] }[];
  ascendantDeg: number;
  ascendantSign: number;
  midheavenDeg: number;
};

export type RectificationResult = {
  best: RectificationCandidate | null;
  candidates: RectificationCandidate[];
  windowMinutes: number;
  stepMinutes: number;
};

export function runRectification(
  approx: BirthInput,
  events: LifeEvent[],
  windowMinutes = 60,
  stepMinutes = 4,
): RectificationResult {
  const candidates: RectificationCandidate[] = [];
  if (events.length === 0) {
    return { best: null, candidates, windowMinutes, stepMinutes };
  }
  for (let delta = -windowMinutes; delta <= windowMinutes; delta += stepMinutes) {
    const cand = shiftBirth(approx, delta);
    const { total, perEvent } = scoreCandidate(cand, events);
    const chart = computeWesternChart(cand, "placidus");
    candidates.push({
      birth: cand,
      offsetMinutes: delta,
      score: total,
      perEvent,
      ascendantDeg: chart.tropicalAscendant,
      ascendantSign: Math.floor(chart.tropicalAscendant / 30),
      midheavenDeg: chart.midheaven,
    });
  }
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  return {
    best: sorted[0] ?? null,
    candidates,
    windowMinutes,
    stepMinutes,
  };
}
