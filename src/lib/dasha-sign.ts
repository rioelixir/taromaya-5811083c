// Sign-based (rashi) dasha systems: Chara (Jaimini), Narayana / Padakrama,
// and Kalachakra. All three return the same three-level tree shape used by the
// planetary dashas in vedic-extended.ts so one UI can render every system.

import type { DashaTree, MahaPeriod, AntarPeriod, DashaPeriod } from "./vedic-extended";

export const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export const SIGN_LORD = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
];

export type SignChart = {
  ascendant: { rashi: number };
  planets: { name: string; rashi: number }[];
};

const YEAR_MS = 365.2425 * 86400_000;

/** Odd-footed signs move zodiacally; even-footed signs move in reverse. */
export function isOddFooted(sign: number): boolean {
  // Aries, Taurus, Gemini, Libra, Scorpio, Sagittarius
  return sign <= 2 || (sign >= 6 && sign <= 8);
}

function signOf(chart: SignChart, planet: string): number | null {
  const p = chart.planets.find((x) => x.name === planet);
  return p ? ((p.rashi % 12) + 12) % 12 : null;
}

/** Exalted / debilitated sign for each planet (used by Narayana adjustments). */
const EXALT: Record<string, number> = {
  Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
};
const DEBIL: Record<string, number> = {
  Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0,
};

/** Distance in years for a sign period: count from the sign to its lord. */
export function signPeriodYears(chart: SignChart, sign: number): number {
  const lord = SIGN_LORD[sign];
  const lordSign = signOf(chart, lord);
  if (lordSign === null) return 1;
  if (lordSign === sign) return 12;
  const step = isOddFooted(sign) ? 1 : -1;
  let n = 0;
  let x = sign;
  while (x !== lordSign && n < 12) {
    x = (x + step + 12) % 12;
    n++;
  }
  return Math.max(1, Math.min(12, n));
}

function signSequence(start: number, count: number): number[] {
  const out: number[] = [];
  let cur = start;
  for (let i = 0; i < count; i++) {
    out.push(cur);
    cur = isOddFooted(cur) ? (cur + 1) % 12 : (cur + 11) % 12;
  }
  return out;
}

function label(sign: number): string {
  return `${SIGN_NAMES[sign]} (${SIGN_LORD[sign]})`;
}

/** Split a sign period into 12 equal sub-periods following the same direction. */
function subPeriods(sign: number, years: number, start: Date, depth: number): DashaPeriod[] {
  const seq = signSequence(sign, 12);
  const each = years / 12;
  const out: DashaPeriod[] = [];
  let t = start.getTime();
  for (const s of seq) {
    const end = t + each * YEAR_MS;
    const node: DashaPeriod = { lord: label(s), years: each, start: new Date(t), end: new Date(end) };
    if (depth > 0) {
      (node as AntarPeriod).pratyantar = subPeriods(s, each, new Date(t), depth - 1) as DashaPeriod[];
    }
    out.push(node);
    t = end;
  }
  return out;
}

function buildTree(
  birth: Date,
  periods: { sign: number; years: number }[],
): DashaTree {
  const now = new Date();
  const maha: MahaPeriod[] = [];
  let t = birth.getTime();
  for (const p of periods) {
    const end = t + p.years * YEAR_MS;
    const antar = subPeriods(p.sign, p.years, new Date(t), 1) as AntarPeriod[];
    maha.push({
      lord: label(p.sign),
      years: p.years,
      start: new Date(t),
      end: new Date(end),
      antar,
    });
    t = end;
  }
  const currentMaha = maha.find((m) => now >= m.start && now < m.end) ?? maha[0];
  const currentAntar =
    currentMaha.antar.find((a) => now >= a.start && now < a.end) ?? currentMaha.antar[0];
  const currentPratyantar =
    currentAntar.pratyantar.find((p) => now >= p.start && now < p.end) ??
    currentAntar.pratyantar[0];
  return { maha, currentMaha, currentAntar, currentPratyantar };
}

/** Chara dasha (Jaimini): starts from the lagna sign, direction by footedness. */
export function computeChara(chart: SignChart, birth: Date, cycles = 2): DashaTree {
  const seq = signSequence(((chart.ascendant.rashi % 12) + 12) % 12, 12 * cycles);
  return buildTree(birth, seq.map((s) => ({ sign: s, years: signPeriodYears(chart, s) })));
}

/**
 * Narayana (Padakrama) dasha: begins from the stronger of the lagna or the 7th
 * house, with the classical one-year adjustment when the sign lord is exalted
 * or debilitated.
 */
export function computeNarayana(chart: SignChart, birth: Date, cycles = 2): DashaTree {
  const asc = ((chart.ascendant.rashi % 12) + 12) % 12;
  const seventh = (asc + 6) % 12;
  const strength = (sign: number) => chart.planets.filter((p) => ((p.rashi % 12) + 12) % 12 === sign).length;
  const start = strength(seventh) > strength(asc) ? seventh : asc;
  const seq = signSequence(start, 12 * cycles);
  return buildTree(
    birth,
    seq.map((s) => {
      let years = signPeriodYears(chart, s);
      const lord = SIGN_LORD[s];
      const lordSign = signOf(chart, lord);
      if (lordSign !== null) {
        if (EXALT[lord] === lordSign) years += 1;
        else if (DEBIL[lord] === lordSign) years -= 1;
      }
      return { sign: s, years: Math.max(1, Math.min(12, years)) };
    }),
  );
}

// ── Kalachakra ────────────────────────────────────────────────────────────────

/** Classical Kalachakra year values per sign. */
export const KALACHAKRA_SIGN_YEARS = [7, 16, 9, 21, 5, 9, 16, 7, 10, 4, 4, 10];

/** Savya (direct) group of nine signs; Apasavya (reverse) group. */
const SAVYA = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const APASAVYA = [8, 7, 6, 5, 4, 3, 2, 1, 0];

/**
 * Kalachakra dasha from the Moon's navamsa pada. Odd (savya) padas run the
 * direct nine-sign group, even (apasavya) padas run the reverse group; each
 * sign carries its classical year value.
 */
export function computeKalachakra(birth: Date, moonLongitude: number, cycles = 2): DashaTree {
  const lon = ((moonLongitude % 360) + 360) % 360;
  const nakSpan = 360 / 27;
  const nakIndex = Math.floor(lon / nakSpan);
  const pada = Math.floor((lon - nakIndex * nakSpan) / (nakSpan / 4)); // 0..3
  const savya = (nakIndex * 4 + pada) % 2 === 0;
  const group = savya ? SAVYA : APASAVYA;
  const offset = savya ? nakIndex % 12 : (12 - (nakIndex % 12)) % 12;
  const seq: { sign: number; years: number }[] = [];
  for (let c = 0; c < cycles; c++) {
    for (const g of group) {
      const sign = (g + offset + pada) % 12;
      seq.push({ sign, years: KALACHAKRA_SIGN_YEARS[sign] });
    }
  }
  return buildTree(birth, seq);
}
