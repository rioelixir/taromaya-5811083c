// Deep Vedic transits (Gochara):
// • Gochara from Moon — transiting planet's house from natal Moon, with
//   classical benefic/malefic rulings per house
// • Vedha check — obstructing houses that cancel a benefic gochara
// • Sade Sati — Saturn's ~7.5y arc over 12th/1st/2nd from natal Moon
// • Kantaka Shani — Saturn over 4th/7th/10th from Moon
// • Ashtakavarga transit strength — bindus in bhinna table at transit rashi
// • Dasha resonance — highlight transits of currently running Dasha lords
// All calculations sidereal (Lahiri) via computeKundli().

import * as A from "astronomy-engine";
import { computeKundli, type KundliChart, type PlanetName } from "./vedic";
import { computeAshtakavarga, type Ashtakavarga } from "./vedic-deep";
import type { DashaTree } from "./vedic-extended";

const norm12 = (n: number) => ((n % 12) + 12) % 12;

// House from Moon (1-based) of a transiting rashi.
function houseFromMoon(transitRashi: number, moonRashi: number) {
  return norm12(transitRashi - moonRashi) + 1;
}

// Classical Gochara benefic-house tables (Phaladeepika).
// A planet transiting these houses from the natal Moon is auspicious.
const GOCHARA_GOOD: Partial<Record<PlanetName, number[]>> = {
  Sun:     [3, 6, 10, 11],
  Moon:    [1, 3, 6, 7, 10, 11],
  Mars:    [3, 6, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11],
  Venus:   [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Saturn:  [3, 6, 11],
  Rahu:    [3, 6, 10, 11],
  Ketu:    [3, 6, 10, 11],
};

// Vedha (obstruction) pairs — if a listed planet transits the vedha house,
// the primary gochara result is neutralized.
// Simplified classical set (Phaladeepika).
const VEDHA: Partial<Record<PlanetName, Record<number, number>>> = {
  Sun:     { 3: 9,  6: 12, 10: 4,  11: 5 },
  Moon:    { 1: 5,  3: 9,  6: 12, 7: 2,  10: 4,  11: 8 },
  Mars:    { 3: 12, 6: 9,  11: 5 },
  Mercury: { 2: 5,  4: 3,  6: 9,  8: 1,  10: 8,  11: 12 },
  Jupiter: { 2: 12, 5: 4,  7: 3,  9: 10, 11: 8 },
  Venus:   { 1: 8,  2: 7,  3: 1,  4: 10, 5: 9,  8: 5,  9: 11, 11: 6, 12: 3 },
  Saturn:  { 3: 12, 6: 9,  11: 5 },
};

export type GocharaResult = {
  planet: PlanetName;
  transitRashi: number;
  houseFromMoon: number;
  favorable: boolean;
  vedhaBy: PlanetName | null;
  bindus?: number;          // ashtakavarga strength at transit sign
  strong?: boolean;         // bindus >= 5
  retrograde: boolean;
  degreeInRashi: number;
};

export type SadeSatiInfo = {
  active: boolean;
  phase: "12th" | "1st" | "2nd" | null;
  intensity: "rising" | "peak" | "setting" | null;
  approxStart: Date;
  approxEnd: Date;
  yearsRemaining: number;
};

export type KantakaShani = {
  active: boolean;
  house: 4 | 7 | 10 | null;
};

export type VedicTransitReport = {
  moonRashi: number;
  transits: GocharaResult[];
  sadeSati: SadeSatiInfo;
  kantakaShani: KantakaShani;
  activeDashaLords: string[];
  dashaResonance: GocharaResult[];   // transits whose planet == mahadasha or antardasha lord
};

/** Compute a sidereal chart of the current sky at given lat/lon. */
export function computeCurrentSideralChart(
  now: Date, latitude: number, longitude: number, tzOffsetHours = 0,
): KundliChart {
  return computeKundli({
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
    hour: now.getUTCHours(),
    minute: now.getUTCMinutes(),
    seconds: now.getUTCSeconds(),
    tzOffsetHours,
    latitude,
    longitude,
  });
}

// Approximate Saturn's entry to sign N (sidereal) by scanning.
function findSaturnEntryToRashi(target: number, around: Date, direction: -1 | 1): Date {
  // Saturn moves ~2.5y per rashi (12°/y). Step in months.
  const stepMs = 15 * 86400000 * direction;
  let d = new Date(around);
  for (let i = 0; i < 24 * 12; i++) {
    const chart = computeKundli({
      year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(),
      hour: 0, minute: 0, tzOffsetHours: 0,
      latitude: 0, longitude: 0,
    });
    const saturn = chart.planets.find((p) => p.name === "Saturn")!;
    if (direction < 0 && saturn.rashi !== target) return new Date(d.getTime() - stepMs);
    if (direction > 0 && saturn.rashi !== target) return d;
    d = new Date(d.getTime() + stepMs);
    void A;
  }
  return d;
}

/** Sade Sati status right now based on natal moon rashi. */
export function computeSadeSati(natalMoonRashi: number, now = new Date()): SadeSatiInfo {
  const chart = computeCurrentSideralChart(now, 0, 0);
  const saturn = chart.planets.find((p) => p.name === "Saturn")!;
  const twelfth = norm12(natalMoonRashi - 1);
  const first = natalMoonRashi;
  const second = norm12(natalMoonRashi + 1);
  const activePhase = saturn.rashi === twelfth ? "12th"
    : saturn.rashi === first ? "1st"
    : saturn.rashi === second ? "2nd"
    : null;
  if (!activePhase) {
    return {
      active: false, phase: null, intensity: null,
      approxStart: now, approxEnd: now, yearsRemaining: 0,
    };
  }
  // Rough phase timing: Saturn ~2.5y per rashi.
  const intensity = activePhase === "12th" ? "rising" : activePhase === "1st" ? "peak" : "setting";
  const start = findSaturnEntryToRashi(twelfth, now, -1);
  const end = findSaturnEntryToRashi(norm12(second + 1), now, +1);
  const yearsRemaining = Math.max(0, (end.getTime() - now.getTime()) / (365.2425 * 86400000));
  return { active: true, phase: activePhase, intensity, approxStart: start, approxEnd: end, yearsRemaining };
}

/** Compute a full deep-Vedic transit report against a natal chart. */
export function computeVedicTransits(
  natal: KundliChart,
  latitude: number, longitude: number,
  dasha?: DashaTree | null,
  now = new Date(),
): VedicTransitReport {
  const sky = computeCurrentSideralChart(now, latitude, longitude);
  const av: Ashtakavarga = computeAshtakavarga(natal);
  const moon = natal.planets.find((p) => p.name === "Moon")!;
  const moonRashi = moon.rashi;

  const transits: GocharaResult[] = sky.planets.map((p) => {
    const h = houseFromMoon(p.rashi, moonRashi);
    const good = GOCHARA_GOOD[p.name] ?? [];
    const favorable = good.includes(h);
    // Vedha check: look for the vedha-house transit planet.
    const vedhaMap = VEDHA[p.name];
    let vedhaBy: PlanetName | null = null;
    if (vedhaMap && vedhaMap[h] !== undefined) {
      const vedhaHouse = vedhaMap[h];
      const rival = sky.planets.find(
        (q) => q.name !== p.name && houseFromMoon(q.rashi, moonRashi) === vedhaHouse,
      );
      if (rival) vedhaBy = rival.name;
    }
    const bh = av.bhinna.find((b) => b.planet === p.name);
    const bindus = bh ? bh.bindus[p.rashi] : undefined;
    return {
      planet: p.name, transitRashi: p.rashi,
      houseFromMoon: h, favorable, vedhaBy,
      bindus, strong: bindus !== undefined ? bindus >= 5 : undefined,
      retrograde: p.retrograde,
      degreeInRashi: p.degreeInRashi,
    };
  });

  const saturnTransit = transits.find((t) => t.planet === "Saturn")!;
  const kantakaShani: KantakaShani = {
    active: [4, 7, 10].includes(saturnTransit.houseFromMoon),
    house: [4, 7, 10].includes(saturnTransit.houseFromMoon)
      ? (saturnTransit.houseFromMoon as 4 | 7 | 10) : null,
  };

  const sadeSati = computeSadeSati(moonRashi, now);

  const activeDashaLords = dasha
    ? [dasha.currentMaha.lord, dasha.currentAntar.lord, dasha.currentPratyantar.lord]
    : [];
  const dashaResonance = transits.filter((t) => activeDashaLords.includes(t.planet));

  return { moonRashi, transits, sadeSati, kantakaShani, activeDashaLords, dashaResonance };
}
