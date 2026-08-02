// Extensions to vedic.ts: divisional charts, Vimshottari dasha,
// yoga detection, and dosha detection.

import type { KundliChart, PlanetName, Planet } from "./vedic";
import { RASHIS } from "./vedic";

// ─────────────────────────────────────────────────────────────
// Divisional charts (Varga)
// Each returns a 12-length array: sign index per varga for each planet
// (indexed 0..8 in order Sun..Ketu of chart.planets).
// ─────────────────────────────────────────────────────────────

const norm12 = (n: number) => ((n % 12) + 12) % 12;

export type VargaCode =
  | "D1" | "D2" | "D3" | "D4" | "D5" | "D6" | "D7" | "D8" | "D9" | "D10" | "D11" | "D12"
  | "D16" | "D20" | "D24" | "D27" | "D30" | "D40" | "D45" | "D60";

export const VARGA_LABELS: Record<VargaCode, { name: string; theme: string }> = {
  D1:  { name: "Rashi",         theme: "Overall life · body · self" },
  D2:  { name: "Hora",          theme: "Wealth · assets" },
  D3:  { name: "Drekkana",      theme: "Siblings · courage" },
  D4:  { name: "Chaturthamsha", theme: "Home · fortune · property" },
  D5:  { name: "Panchamsha",    theme: "Fame · authority · merit" },
  D6:  { name: "Shashtamsha",   theme: "Health · illness · adversity" },
  D7:  { name: "Saptamsha",     theme: "Children · progeny" },
  D8:  { name: "Ashtamsha",     theme: "Sudden events · longevity · hidden risk" },
  D9:  { name: "Navamsa",       theme: "Marriage · dharma · fortune" },
  D10: { name: "Dashamsha",     theme: "Career · profession · fame" },
  D11: { name: "Rudramsha",     theme: "Gains · income · fulfilment of desires" },
  D12: { name: "Dwadashamsha",  theme: "Parents · ancestry" },
  D16: { name: "Shodashamsha",  theme: "Vehicles · comforts · pleasures" },
  D20: { name: "Vimshamsha",    theme: "Spiritual life · sadhana" },
  D24: { name: "Chaturvimshamsha", theme: "Education · learning" },
  D27: { name: "Nakshatramsha", theme: "Strength · weakness (Bhamsha)" },
  D30: { name: "Trimshamsha",   theme: "Misfortunes · evils" },
  D40: { name: "Khavedamsha",   theme: "Maternal legacy · auspicious effects" },
  D45: { name: "Akshavedamsha", theme: "Paternal legacy · overall character" },
  D60: { name: "Shashtiamsha",  theme: "Karmic essence · past life" },
};

/** Mode index: 0=movable (Aries/Cancer/Libra/Capricorn), 1=fixed, 2=dual. */
const mode = (r: number) => r % 3;
const isOdd = (r: number) => r % 2 === 0; // Aries=0 counts as odd
const FIRE  = new Set([0, 4, 8]);   // Aries, Leo, Sagittarius
const EARTH = new Set([1, 5, 9]);   // Taurus, Virgo, Capricorn
const AIR   = new Set([2, 6, 10]);  // Gemini, Libra, Aquarius
const WATER = new Set([3, 7, 11]);  // Cancer, Scorpio, Pisces

function d1(r: number): number { return r; }

// D2 Hora — odd 0-15°→Leo, 15-30°→Cancer; even reversed.
function d2(r: number, d: number): number {
  if (isOdd(r)) return d < 15 ? 4 : 3;
  return d < 15 ? 3 : 4;
}

// D3 Drekkana — 10° parts, jumps of 4.
function d3(r: number, d: number): number {
  if (d < 10) return r;
  if (d < 20) return norm12(r + 4);
  return norm12(r + 8);
}

// D4 Chaturthamsha — 7.5° parts, jumps of 3.
function d4(r: number, d: number): number {
  const part = Math.floor(d / 7.5); // 0..3
  return norm12(r + part * 3);
}

// D7 Saptamsha — 7 parts; odd starts same, even starts +6.
function d7(r: number, d: number): number {
  const part = Math.floor(d / (30 / 7));
  return norm12((isOdd(r) ? r : r + 6) + part);
}

// D9 Navamsa — 9 parts; movable=same, fixed=+8, dual=+4.
function d9(r: number, d: number): number {
  const part = Math.floor(d / (30 / 9));
  const m = mode(r);
  const start = m === 0 ? r : m === 1 ? r + 8 : r + 4;
  return norm12(start + part);
}

// D10 Dashamsha — 10 parts of 3°; odd starts same, even starts +8.
function d10(r: number, d: number): number {
  const part = Math.floor(d / 3);
  return norm12((isOdd(r) ? r : r + 8) + part);
}

// D12 Dwadashamsha — 12 parts of 2.5°, starts from same sign.
function d12(r: number, d: number): number {
  const part = Math.floor(d / 2.5);
  return norm12(r + part);
}

// Generic "start-sign by mode" divisional (D16/D20/D45 etc).
function byMode(r: number, d: number, div: number, movable: number, fixed: number, dual: number) {
  const part = Math.floor(d / (30 / div));
  const m = mode(r);
  const start = m === 0 ? movable : m === 1 ? fixed : dual;
  return norm12(start + part);
}

// D16 Shodashamsha — movable→Aries, fixed→Leo, dual→Sagittarius.
function d16(r: number, d: number): number { return byMode(r, d, 16, 0, 4, 8); }

// D20 Vimshamsha — movable→Aries, fixed→Sagittarius, dual→Leo.
function d20(r: number, d: number): number { return byMode(r, d, 20, 0, 8, 4); }

// D24 Chaturvimshamsha — odd→Leo, even→Cancer.
function d24(r: number, d: number): number {
  const part = Math.floor(d / (30 / 24));
  return norm12((isOdd(r) ? 4 : 3) + part);
}

// D27 Nakshatramsha — Fire→Aries, Earth→Cancer, Air→Libra, Water→Capricorn.
function d27(r: number, d: number): number {
  const part = Math.floor(d / (30 / 27));
  const start = FIRE.has(r) ? 0 : EARTH.has(r) ? 3 : AIR.has(r) ? 6 : 9;
  void WATER; // referenced for symmetry
  return norm12(start + part);
}

// D30 Trimshamsha — non-uniform Parashari allocation.
function d30(r: number, d: number): number {
  if (isOdd(r)) {
    if (d < 5)  return 0;  // Mars → Aries
    if (d < 10) return 10; // Saturn → Aquarius
    if (d < 18) return 8;  // Jupiter → Sagittarius
    if (d < 25) return 2;  // Mercury → Gemini
    return 6;              // Venus → Libra
  }
  if (d < 5)  return 1;  // Venus → Taurus
  if (d < 12) return 5;  // Mercury → Virgo
  if (d < 20) return 11; // Jupiter → Pisces
  if (d < 25) return 9;  // Saturn → Capricorn
  return 7;              // Mars → Scorpio
}

// D40 Khavedamsha — odd→Aries, even→Libra.
function d40(r: number, d: number): number {
  const part = Math.floor(d / (30 / 40));
  return norm12((isOdd(r) ? 0 : 6) + part);
}

// D45 Akshavedamsha — movable→Aries, fixed→Leo, dual→Sagittarius.
function d45(r: number, d: number): number { return byMode(r, d, 45, 0, 4, 8); }

// D60 Shashtiamsha — (rashi + part) mod 12 with part = floor(deg*2).
function d60(r: number, d: number): number {
  return norm12(r + Math.floor(d * 2));
}

// D5 Panchamsha, D6 Shashtamsha, D8 Ashtamsha, D11 Rudramsha — equal
// divisions counted onward from the sign itself (Parashari cyclical rule).
function cyclic(r: number, d: number, div: number): number {
  return norm12(r + Math.floor(d / (30 / div)));
}
function d5(r: number, d: number): number { return cyclic(r, d, 5); }
function d6(r: number, d: number): number { return cyclic(r, d, 6); }
function d8(r: number, d: number): number { return cyclic(r, d, 8); }
function d11(r: number, d: number): number { return cyclic(r, d, 11); }

const VARGA_FNS: Record<VargaCode, (r: number, d: number) => number> = {
  D1: d1, D2: d2, D3: d3, D4: d4, D5: d5, D6: d6, D7: d7, D8: d8,
  D9: d9, D10: d10, D11: d11, D12: d12,
  D16: d16, D20: d20, D24: d24, D27: d27, D30: d30, D40: d40, D45: d45, D60: d60,
};

export const VARGA_ORDER: VargaCode[] = [
  "D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","D11","D12",
  "D16","D20","D24","D27","D30","D40","D45","D60",
];

export type VargaChart = {
  code: VargaCode;
  ascendantSign: number;
  planetSigns: { name: PlanetName; sign: number; retrograde: boolean }[];
};

export function computeVarga(chart: KundliChart, code: VargaCode): VargaChart {
  const fn = VARGA_FNS[code];
  const ascendantSign = fn(chart.ascendant.rashi, chart.ascendant.degreeInRashi);
  const planetSigns = chart.planets.map((p) => ({
    name: p.name,
    sign: fn(p.rashi, p.degreeInRashi),
    retrograde: p.retrograde,
  }));
  return { code, ascendantSign, planetSigns };
}

/** Compute the full Shodashavarga (all 16 divisional charts). */
export function computeAllVargas(chart: KundliChart): Record<VargaCode, VargaChart> {
  return Object.fromEntries(
    VARGA_ORDER.map((code) => [code, computeVarga(chart, code)]),
  ) as Record<VargaCode, VargaChart>;
}

/**
 * Vimshopaka Bala (Shadvarga weighting) — planet's positional strength across
 * the 6 main divisions weighted by classical Parashari weights (sum = 20).
 * Returns 0..20 per planet based on how many "friendly" placements the planet
 * holds relative to its D1 sign (same sign counts, adjacent friendly signs half).
 */
const SHADVARGA_WEIGHTS: Partial<Record<VargaCode, number>> = {
  D1: 6, D2: 2, D3: 4, D9: 5, D12: 2, D30: 1,
};
export function vimshopakaBala(chart: KundliChart): { name: PlanetName; score: number }[] {
  return chart.planets.map((p) => {
    let score = 0;
    for (const [code, w] of Object.entries(SHADVARGA_WEIGHTS) as [VargaCode, number][]) {
      const v = computeVarga(chart, code);
      const s = v.planetSigns.find((x) => x.name === p.name)!.sign;
      if (s === p.rashi) score += w;
      else if (mode(s) === mode(p.rashi)) score += w * 0.5;
    }
    return { name: p.name, score: Math.round(score * 10) / 10 };
  });
}

// ─────────────────────────────────────────────────────────────
// Vimshottari Dasha
// ─────────────────────────────────────────────────────────────

export const DASHA_SEQUENCE: { lord: string; years: number }[] = [
  { lord: "Ketu", years: 7 },
  { lord: "Venus", years: 20 },
  { lord: "Sun", years: 6 },
  { lord: "Moon", years: 10 },
  { lord: "Mars", years: 7 },
  { lord: "Rahu", years: 18 },
  { lord: "Jupiter", years: 16 },
  { lord: "Saturn", years: 19 },
  { lord: "Mercury", years: 17 },
];

export const DASHA_TOTAL_YEARS = 120;

export type DashaPeriod = {
  lord: string;
  start: Date;
  end: Date;
  years: number;
};

export type AntarPeriod = DashaPeriod & { pratyantar: DashaPeriod[] };
export type MahaPeriod = DashaPeriod & { antar: AntarPeriod[] };

export type DashaTree = {
  maha: MahaPeriod[];
  currentMaha: MahaPeriod;
  currentAntar: AntarPeriod;
  currentPratyantar: DashaPeriod;
};

const yearsMs = (y: number) => y * 365.2425 * 86400_000;

/** Build a 3-level dasha tree (Maha → Antar → Pratyantar) for any 9-lord cycle. */
function buildDashaTree(
  birth: Date,
  seq: { lord: string; years: number }[],
  totalYears: number,
  startingIndex: number,
  fractionElapsed: number,
): DashaTree {
  const now = new Date();
  const startOfFirstMaha = new Date(
    birth.getTime() - yearsMs(seq[startingIndex].years * fractionElapsed),
  );

  const maha: MahaPeriod[] = [];
  let cursor = startOfFirstMaha;
  const L = seq.length;
  // Short cycles (Yogini 36y, Ashtottari 108y) repeat after one round, so
  // build enough rounds to cover a full human lifespan from birth.
  const rounds = Math.max(1, Math.ceil(130 / totalYears));
  for (let i = 0; i < L * rounds; i++) {
    const d = seq[(startingIndex + i) % L];
    if (d.years <= 0) { continue; }
    const mahaEnd = new Date(cursor.getTime() + yearsMs(d.years));
    const antar: AntarPeriod[] = [];
    let ac = cursor;
    const antarStartIdx = seq.findIndex((x) => x.lord === d.lord && x.years > 0);
    let placed = 0;
    for (let j = 0; placed < L && j < L * 2; j++) {
      const a = seq[(antarStartIdx + j) % L];
      if (a.years <= 0) { continue; }
      placed++;
      const antarYears = (d.years * a.years) / totalYears;
      const antarEnd = new Date(ac.getTime() + yearsMs(antarYears));
      const pratStartIdx = seq.findIndex((x) => x.lord === a.lord && x.years > 0);
      const pratyantar: DashaPeriod[] = [];
      let pc = ac;
      let pPlaced = 0;
      for (let k = 0; pPlaced < L && k < L * 2; k++) {
        const pr = seq[(pratStartIdx + k) % L];
        if (pr.years <= 0) { continue; }
        pPlaced++;
        const pyrs = (antarYears * pr.years) / totalYears;
        const pend = new Date(pc.getTime() + yearsMs(pyrs));
        pratyantar.push({ lord: pr.lord, years: pyrs, start: pc, end: pend });
        pc = pend;
      }
      antar.push({ lord: a.lord, years: antarYears, start: ac, end: antarEnd, pratyantar });
      ac = antarEnd;
    }
    maha.push({ lord: d.lord, years: d.years, start: cursor, end: mahaEnd, antar });
    cursor = mahaEnd;
  }

  const currentMaha = maha.find((m) => now >= m.start && now < m.end) ?? maha[0];
  const currentAntar =
    currentMaha.antar.find((a) => now >= a.start && now < a.end) ?? currentMaha.antar[0];
  const currentPratyantar =
    currentAntar.pratyantar.find((p) => now >= p.start && now < p.end) ??
    currentAntar.pratyantar[0];

  return { maha, currentMaha, currentAntar, currentPratyantar };
}

/** Vimshottari — 120y cycle, nakshatra-based. */
export function computeVimshottari(
  birth: Date,
  moonNakshatraIndex: number,
  moonDegInNak: number,
): DashaTree {
  const NAK_SPAN = 360 / 27;
  const fraction = moonDegInNak / NAK_SPAN;
  const lordIndex = moonNakshatraIndex % 9;
  return buildDashaTree(birth, DASHA_SEQUENCE, DASHA_TOTAL_YEARS, lordIndex, fraction);
}

/** Ashtottari — 108-year, 8 lords (traditional Krittika-onward mapping). */
export const ASHTOTTARI_SEQUENCE: { lord: string; years: number }[] = [
  { lord: "Sun", years: 6 },
  { lord: "Moon", years: 15 },
  { lord: "Mars", years: 8 },
  { lord: "Mercury", years: 17 },
  { lord: "Saturn", years: 10 },
  { lord: "Jupiter", years: 19 },
  { lord: "Rahu", years: 12 },
  { lord: "Venus", years: 21 },
];
export const ASHTOTTARI_TOTAL_YEARS = 108;

export function computeAshtottari(
  birth: Date,
  moonNakshatraIndex: number,
  moonDegInNak: number,
): DashaTree {
  const NAK_SPAN = 360 / 27;
  const fraction = moonDegInNak / NAK_SPAN;
  const lordIndex = moonNakshatraIndex % 8;
  return buildDashaTree(birth, ASHTOTTARI_SEQUENCE, ASHTOTTARI_TOTAL_YEARS, lordIndex, fraction);
}

/** Yogini — 36-year, 8 yoginis; starting yogini = (moonNak + 1) % 8. */
export const YOGINI_SEQUENCE: { lord: string; years: number }[] = [
  { lord: "Mangala (Moon)", years: 1 },
  { lord: "Pingala (Sun)", years: 2 },
  { lord: "Dhanya (Jupiter)", years: 3 },
  { lord: "Bhramari (Mars)", years: 4 },
  { lord: "Bhadrika (Mercury)", years: 5 },
  { lord: "Ulka (Saturn)", years: 6 },
  { lord: "Siddha (Venus)", years: 7 },
  { lord: "Sankata (Rahu)", years: 8 },
];
export const YOGINI_TOTAL_YEARS = 36;

export function computeYogini(
  birth: Date,
  moonNakshatraIndex: number,
  moonDegInNak: number,
): DashaTree {
  const NAK_SPAN = 360 / 27;
  const fraction = moonDegInNak / NAK_SPAN;
  const lordIndex = (moonNakshatraIndex + 1) % 8;
  return buildDashaTree(birth, YOGINI_SEQUENCE, YOGINI_TOTAL_YEARS, lordIndex, fraction);
}

// ─────────────────────────────────────────────────────────────
// Yoga detection
// ─────────────────────────────────────────────────────────────

export type Yoga = {
  name: string;
  category: "auspicious" | "wealth" | "royal" | "spiritual" | "challenging";
  present: boolean;
  detail: string;
};

const BENEFICS: PlanetName[] = ["Jupiter", "Venus", "Mercury", "Moon"];
const MALEFICS: PlanetName[] = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"];

function houseOf(p: Planet, ascRashi: number): number {
  return ((p.rashi - ascRashi + 12) % 12) + 1;
}

function planetsInHouse(chart: KundliChart, house: number): Planet[] {
  return chart.planets.filter((p) => houseOf(p, chart.ascendant.rashi) === house);
}

// Exaltation signs
const EXALT: Partial<Record<PlanetName, number>> = {
  Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
};
// Debilitation signs
const DEBIL: Partial<Record<PlanetName, number>> = {
  Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0,
};
// Own signs
const OWN: Partial<Record<PlanetName, number[]>> = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5],
  Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
};

const KENDRAS = [1, 4, 7, 10];
const TRIKONAS = [1, 5, 9];

export function detectYogas(chart: KundliChart): Yoga[] {
  const asc = chart.ascendant.rashi;
  const findPlanet = (n: PlanetName) => chart.planets.find((p) => p.name === n)!;
  const sun = findPlanet("Sun");
  const moon = findPlanet("Moon");
  const mars = findPlanet("Mars");
  const merc = findPlanet("Mercury");
  const jup = findPlanet("Jupiter");
  const ven = findPlanet("Venus");
  const sat = findPlanet("Saturn");

  const yogas: Yoga[] = [];

  // Gaja Kesari — Jupiter in kendra from Moon
  {
    const moonHouse = houseOf(moon, asc);
    const jupHouse = houseOf(jup, asc);
    const rel = ((jupHouse - moonHouse + 12) % 12) + 1;
    const present = [1, 4, 7, 10].includes(rel);
    yogas.push({
      name: "Gaja Kesari Yoga",
      category: "auspicious",
      present,
      detail: present
        ? "Jupiter sits in a kendra from the Moon — wisdom, virtue, and lasting fame."
        : "Jupiter is not in a kendra from the Moon.",
    });
  }

  // Budhaditya — Sun & Mercury conjunct (same sign), Mercury not combust deeply
  {
    const conj = sun.rashi === merc.rashi;
    yogas.push({
      name: "Budhaditya Yoga",
      category: "auspicious",
      present: conj,
      detail: conj
        ? "Sun and Mercury share a sign — intelligence, communication, and administrative skill."
        : "Sun and Mercury are not conjunct.",
    });
  }

  // Chandra-Mangal — Moon & Mars conjunct
  {
    const conj = moon.rashi === mars.rashi;
    yogas.push({
      name: "Chandra-Mangal Yoga",
      category: "wealth",
      present: conj,
      detail: conj
        ? "Moon and Mars in the same sign — commercial acumen and earnings from own effort."
        : "Moon and Mars are not conjunct.",
    });
  }

  // Panch Mahapurusha
  const mahaPurusha: [PlanetName, string][] = [
    ["Mars", "Ruchaka"],
    ["Mercury", "Bhadra"],
    ["Jupiter", "Hamsa"],
    ["Venus", "Malavya"],
    ["Saturn", "Sasa"],
  ];
  for (const [pl, name] of mahaPurusha) {
    const p = findPlanet(pl);
    const inOwnOrExalt = (OWN[pl] ?? []).includes(p.rashi) || EXALT[pl] === p.rashi;
    const inKendra = KENDRAS.includes(houseOf(p, asc));
    const present = inOwnOrExalt && inKendra;
    yogas.push({
      name: `${name} Yoga`,
      category: "royal",
      present,
      detail: present
        ? `${pl} is in own/exalted sign in a kendra — Panch Mahapurusha ${name}.`
        : `${pl} is not in own/exalted sign in a kendra.`,
    });
  }

  // Kemadruma — no planet in 2nd/12th from Moon (excluding Sun for some traditions)
  {
    const moonSign = moon.rashi;
    const second = (moonSign + 1) % 12;
    const twelfth = (moonSign + 11) % 12;
    const others = chart.planets.filter((p) => p.name !== "Moon" && p.name !== "Rahu" && p.name !== "Ketu");
    const anyIn = others.some((p) => p.rashi === second || p.rashi === twelfth || p.rashi === moonSign);
    const present = !anyIn;
    yogas.push({
      name: "Kemadruma Yoga",
      category: "challenging",
      present,
      detail: present
        ? "Moon stands alone with no planets in 2nd or 12th — periods of isolation and effort."
        : "Kemadruma is not present — planets attend the Moon.",
    });
  }

  // Adhi Yoga — benefics in 6th/7th/8th from Moon
  {
    const moonSign = moon.rashi;
    const signs = [(moonSign + 5) % 12, (moonSign + 6) % 12, (moonSign + 7) % 12];
    const present = BENEFICS.every((b) => {
      const p = findPlanet(b);
      return signs.includes(p.rashi);
    });
    yogas.push({
      name: "Adhi Yoga",
      category: "royal",
      present,
      detail: present
        ? "Benefics occupy the 6th, 7th, 8th from Moon — leadership, respect, comfort."
        : "Benefics are not aligned in the 6/7/8 from Moon.",
    });
  }

  // Saraswati Yoga — Jupiter, Venus, Mercury in kendra/trikona from Lagna
  {
    const good = new Set([...KENDRAS, ...TRIKONAS]);
    const present = [jup, ven, merc].every((p) => good.has(houseOf(p, asc)));
    yogas.push({
      name: "Saraswati Yoga",
      category: "spiritual",
      present,
      detail: present
        ? "Jupiter, Venus, and Mercury all occupy kendra or trikona — learning, art, eloquence."
        : "The learning trio is not aligned in auspicious houses.",
    });
  }

  // Lakshmi Yoga — Venus in own/exalted + 9th lord strong
  {
    const venGood = (OWN.Venus ?? []).includes(ven.rashi) || EXALT.Venus === ven.rashi;
    yogas.push({
      name: "Lakshmi Yoga (simple)",
      category: "wealth",
      present: venGood,
      detail: venGood
        ? "Venus is dignified — beauty, luxury, harmonious relationships."
        : "Venus is not in own/exalted sign.",
    });
  }

  // Neecha Bhanga — planet in debilitation but debilitation cancelled (simplified: lord of that sign in kendra from Lagna or Moon)
  {
    const debilitated = chart.planets.filter(
      (p) => DEBIL[p.name] === p.rashi,
    );
    yogas.push({
      name: "Neecha Bhanga Raja Yoga",
      category: "royal",
      present: debilitated.length > 0,
      detail:
        debilitated.length > 0
          ? `${debilitated.map((p) => p.name).join(", ")} is debilitated — check for cancellation for royal rise from fall.`
          : "No debilitated planets available for cancellation.",
    });
  }

  // Vipreet Raj Yoga (simplified) — lord of 6/8/12 placed in 6/8/12
  {
    const dusthana = [6, 8, 12];
    const lordSignOf = (h: number) => (asc + h - 1) % 12;
    const lordPlanetName = (sign: number): PlanetName => {
      const lord = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"][sign] as PlanetName;
      return lord;
    };
    const involved: string[] = [];
    for (const h of dusthana) {
      const lord = lordPlanetName(lordSignOf(h));
      const lp = findPlanet(lord);
      if (dusthana.includes(houseOf(lp, asc))) involved.push(`${h}-lord ${lord}`);
    }
    yogas.push({
      name: "Vipreet Raja Yoga",
      category: "royal",
      present: involved.length >= 2,
      detail:
        involved.length > 0
          ? `${involved.join("; ")} in dusthana — reversal-of-fortune rise through adversity.`
          : "No dusthana-lord alignment for Vipreet Raja.",
    });
  }

  // Parivartana — mutual sign exchange (simplified, first match)
  {
    const lordOfSign: PlanetName[] = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];
    const pairs: string[] = [];
    for (const p of chart.planets) {
      if (p.name === "Rahu" || p.name === "Ketu") continue;
      const dispositor = lordOfSign[p.rashi];
      if (dispositor === p.name) continue;
      const dp = findPlanet(dispositor);
      const dpDispositor = lordOfSign[dp.rashi];
      if (dpDispositor === p.name && p.name < dispositor) {
        pairs.push(`${p.name} ↔ ${dispositor}`);
      }
    }
    yogas.push({
      name: "Parivartana Yoga",
      category: "auspicious",
      present: pairs.length > 0,
      detail: pairs.length
        ? `Sign exchange: ${pairs.join(", ")} — mutual amplification.`
        : "No mutual sign exchange detected.",
    });
  }

  // Dhana Yoga (simplified) — 2nd or 11th lord conjunct benefic in a kendra/trikona
  {
    const lord2 = (asc + 1) % 12;
    const lord11 = (asc + 10) % 12;
    const lordOfSign: PlanetName[] = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];
    const wealthLords = [lordOfSign[lord2], lordOfSign[lord11]];
    const good = new Set([...KENDRAS, ...TRIKONAS]);
    const present = wealthLords.some((l) => {
      const p = findPlanet(l);
      return good.has(houseOf(p, asc));
    });
    yogas.push({
      name: "Dhana Yoga",
      category: "wealth",
      present,
      detail: present
        ? "Wealth-house lord occupies auspicious ground — accumulation potential."
        : "Wealth lords are not favorably placed.",
    });
  }

  void sat; // used implicitly through Panch Mahapurusha
  return yogas;
}

// ─────────────────────────────────────────────────────────────
// Dosha detection
// ─────────────────────────────────────────────────────────────

export type Dosha = {
  name: string;
  present: boolean;
  severity?: "mild" | "moderate" | "strong";
  detail: string;
  remedy?: string;
};

export function detectDoshas(chart: KundliChart): Dosha[] {
  const asc = chart.ascendant.rashi;
  const findPlanet = (n: PlanetName) => chart.planets.find((p) => p.name === n)!;
  const doshas: Dosha[] = [];

  // Manglik — Mars in 1, 2, 4, 7, 8, 12 from Lagna
  {
    const mars = findPlanet("Mars");
    const h = houseOf(mars, asc);
    const strongHouses = [1, 7, 8];
    const mildHouses = [2, 4, 12];
    const present = [...strongHouses, ...mildHouses].includes(h);
    const severity: Dosha["severity"] = strongHouses.includes(h) ? "strong" : mildHouses.includes(h) ? "moderate" : undefined;
    doshas.push({
      name: "Manglik Dosha",
      present,
      severity,
      detail: present
        ? `Mars sits in the ${h}${h === 1 ? "st" : h === 2 ? "nd" : "th"} house — Manglik influence on partnership and temperament.`
        : "Mars is not in a Manglik house — no dosha detected.",
      remedy: present
        ? "Chant Mangal Chalisa on Tuesdays; recite Hanuman Chalisa; consider red coral only after consulting an astrologer."
        : undefined,
    });
  }

  // Kaal Sarpa — all 7 planets (Sun..Saturn) between Rahu and Ketu axis
  {
    const rahu = findPlanet("Rahu");
    const ketu = findPlanet("Ketu");
    // between rahu → ketu going forward, or ketu → rahu going forward
    const inside = (lon: number, start: number, end: number) => {
      const span = ((end - start + 360) % 360);
      const rel = ((lon - start + 360) % 360);
      return rel > 0 && rel < span;
    };
    const others = chart.planets.filter((p) => p.name !== "Rahu" && p.name !== "Ketu");
    const allBetweenRK = others.every((p) => inside(p.longitude, rahu.longitude, ketu.longitude));
    const allBetweenKR = others.every((p) => inside(p.longitude, ketu.longitude, rahu.longitude));
    const present = allBetweenRK || allBetweenKR;
    doshas.push({
      name: "Kaal Sarpa Dosha",
      present,
      severity: present ? "strong" : undefined,
      detail: present
        ? "All seven planets fall on one side of the Rahu–Ketu axis — Kaal Sarpa is present, intensifying karmic themes."
        : "Planets straddle both sides of the Rahu–Ketu axis — no Kaal Sarpa.",
      remedy: present
        ? "Recite Maha Mrityunjaya mantra; perform Kaal Sarpa shanti at a Rahu-Ketu temple; observe Nag Panchami."
        : undefined,
    });
  }

  // Sade Sati — Saturn transiting 12th, 1st, or 2nd from Moon sign (current transit — approximate using birth positions)
  {
    const sat = findPlanet("Saturn");
    const moon = findPlanet("Moon");
    const diff = (sat.rashi - moon.rashi + 12) % 12;
    const inSadeSati = diff === 11 || diff === 0 || diff === 1;
    const phase = diff === 11 ? "Rising (12th from Moon)" : diff === 0 ? "Peak (over natal Moon)" : diff === 1 ? "Setting (2nd from Moon)" : "";
    doshas.push({
      name: "Sade Sati (natal)",
      present: inSadeSati,
      severity: inSadeSati ? "moderate" : undefined,
      detail: inSadeSati
        ? `At birth, Saturn was in ${phase} from Moon — foundational Sade Sati impression.`
        : "Saturn was not in Sade Sati position at birth.",
      remedy: inSadeSati
        ? "Chant Shani mantra Saturdays; feed crows; light sesame-oil lamps under a Peepal tree."
        : undefined,
    });
  }

  // Pitra Dosha (simplified) — Sun with Rahu or Ketu, or Sun in 9th afflicted
  {
    const sun = findPlanet("Sun");
    const rahu = findPlanet("Rahu");
    const ketu = findPlanet("Ketu");
    const conjR = sun.rashi === rahu.rashi;
    const conjK = sun.rashi === ketu.rashi;
    const present = conjR || conjK;
    doshas.push({
      name: "Pitra Dosha (indication)",
      present,
      severity: present ? "mild" : undefined,
      detail: present
        ? `Sun conjuncts ${conjR ? "Rahu" : "Ketu"} — ancestral karmic themes may surface.`
        : "Sun is unafflicted by nodes — no clear Pitra indication.",
      remedy: present
        ? "Offer tarpan to ancestors on amavasya; feed brahmins or the needy; recite Pitra Gayatri."
        : undefined,
    });
  }

  return doshas;
}

// ─────────────────────────────────────────────────────────────
// Small display helpers
// ─────────────────────────────────────────────────────────────

export function shortSign(i: number): string {
  return RASHIS[i].slice(0, 3);
}

export function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
