// Varshphal depth — Tajika strength and annual timing systems.
//
// Adds to varshphal-deep.ts:
//   • Panchavargeeya Bala — the five-fold Tajika strength (Kshetra, Uchcha,
//     Hadda, Drekkana, Navamsa), reduced to Vishwa points out of 20.
//   • Patyayini Dasha — the year divided by planetary degrees traversed.
//   • Mudda Dasha — the Vimshottari order compressed into one solar year.
//   • A year summary that states the theme, the strongest supports and the
//     periods to watch.
//
// References: Tajika Neelakanthi; K.S. Charak, "Yearly Horoscope"; B.V. Raman,
// "Varshaphal or the Hindu Progressed Horoscope".

import type { KundliChart, PlanetName } from "./vedic";
import { RASHIS, RASHI_LORDS } from "./vedic";
import { DASHA_SEQUENCE, DASHA_TOTAL_YEARS } from "./vedic-extended";

const norm360 = (x: number) => ((x % 360) + 360) % 360;

const EXALT_DEG: Partial<Record<PlanetName, number>> = {
  // Absolute zodiac longitude of exact exaltation.
  Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200,
};
const OWN_SIGNS: Partial<Record<PlanetName, number[]>> = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5],
  Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
};
// Simplified natural friendship used for Kshetra Bala grading.
const FRIENDS: Record<PlanetName, PlanetName[]> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
  Rahu: ["Venus", "Saturn"],
  Ketu: ["Mars", "Jupiter"],
};

const TAJIKA_PLANETS: PlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
];

// Egyptian terms (Hadda) end-degrees per sign, mirrored from varshphal-deep.
const HADDA: [PlanetName, number][][] = [
  [["Jupiter", 6], ["Venus", 12], ["Mercury", 20], ["Mars", 25], ["Saturn", 30]],
  [["Venus", 8], ["Mercury", 14], ["Jupiter", 22], ["Saturn", 27], ["Mars", 30]],
  [["Mercury", 6], ["Jupiter", 12], ["Venus", 17], ["Mars", 24], ["Saturn", 30]],
  [["Mars", 7], ["Venus", 13], ["Mercury", 19], ["Jupiter", 26], ["Saturn", 30]],
  [["Jupiter", 6], ["Venus", 11], ["Saturn", 18], ["Mercury", 24], ["Mars", 30]],
  [["Mercury", 7], ["Venus", 13], ["Jupiter", 18], ["Mars", 24], ["Saturn", 30]],
  [["Saturn", 6], ["Mercury", 11], ["Jupiter", 19], ["Venus", 24], ["Mars", 30]],
  [["Mars", 7], ["Venus", 11], ["Mercury", 19], ["Jupiter", 24], ["Saturn", 30]],
  [["Jupiter", 12], ["Venus", 17], ["Mercury", 21], ["Saturn", 26], ["Mars", 30]],
  [["Mercury", 7], ["Jupiter", 14], ["Venus", 22], ["Saturn", 26], ["Mars", 30]],
  [["Mercury", 7], ["Venus", 13], ["Jupiter", 20], ["Mars", 25], ["Saturn", 30]],
  [["Venus", 12], ["Jupiter", 16], ["Mercury", 19], ["Mars", 28], ["Saturn", 30]],
];

function haddaLord(rashi: number, deg: number): PlanetName {
  for (const [lord, end] of HADDA[rashi]) if (deg < end) return lord;
  return HADDA[rashi][HADDA[rashi].length - 1][0];
}

function navamsaSign(longitude: number): number {
  return Math.floor(norm360(longitude) / (30 / 9)) % 12;
}

function drekkanaSign(rashi: number, deg: number): number {
  return (rashi + Math.floor(deg / 10) * 4) % 12;
}

export type BalaComponent = { label: string; points: number; max: number; note: string };
export type PanchavargeeyaBala = {
  planet: PlanetName;
  components: BalaComponent[];
  total: number;   // out of 80
  vishwa: number;  // total / 4, out of 20
  grade: "very strong" | "strong" | "moderate" | "weak";
};

/** Panchavargeeya Bala — five-fold Tajika strength reduced to Vishwa points. */
export function computePanchavargeeyaBala(chart: KundliChart): PanchavargeeyaBala[] {
  return TAJIKA_PLANETS.map((name) => {
    const p = chart.planets.find((x) => x.name === name)!;
    const components: BalaComponent[] = [];

    // 1. Kshetra Bala (max 30) — dignity of the occupied sign.
    {
      const own = (OWN_SIGNS[name] ?? []).includes(p.rashi);
      const signLord = RASHI_LORDS[p.rashi] as PlanetName;
      const friend = FRIENDS[name].includes(signLord);
      const exalted = Math.abs(((EXALT_DEG[name] ?? 0) - p.longitude + 540) % 360 - 180) > 150;
      const points = own ? 30 : exalted ? 30 : friend ? 22.5 : signLord === name ? 30 : 15;
      components.push({
        label: "Kshetra (sign dignity)", points, max: 30,
        note: own ? `In own sign ${RASHIS[p.rashi]}.`
          : friend ? `In ${RASHIS[p.rashi]}, ruled by the friendly ${signLord}.`
          : `In ${RASHIS[p.rashi]}, ruled by ${signLord}.`,
      });
    }

    // 2. Uchcha Bala (max 20) — proximity to the exaltation point.
    {
      const ex = EXALT_DEG[name] ?? 0;
      let dist = Math.abs(norm360(p.longitude - ex));
      if (dist > 180) dist = 360 - dist;
      const points = Math.round((20 * (180 - dist)) / 180 * 100) / 100;
      components.push({
        label: "Uchcha (exaltation arc)", points, max: 20,
        note: `${dist.toFixed(1)} degrees from the exaltation point.`,
      });
    }

    // 3. Hadda Bala (max 15) — Egyptian term rulership.
    {
      const lord = haddaLord(p.rashi, p.degreeInRashi);
      const points = lord === name ? 15 : FRIENDS[name].includes(lord) ? 11.25 : 3.75;
      components.push({
        label: "Hadda (term lord)", points, max: 15,
        note: `Term ruled by ${lord}.`,
      });
    }

    // 4. Drekkana Bala (max 10) — decan rulership.
    {
      const dSign = drekkanaSign(p.rashi, p.degreeInRashi);
      const dLord = RASHI_LORDS[dSign] as PlanetName;
      const points = dLord === name ? 10 : FRIENDS[name].includes(dLord) ? 7.5 : 2.5;
      components.push({
        label: "Drekkana (decan lord)", points, max: 10,
        note: `Decan ruled by ${dLord}.`,
      });
    }

    // 5. Navamsa Bala (max 5) — ninth-part rulership.
    {
      const nSign = navamsaSign(p.longitude);
      const nLord = RASHI_LORDS[nSign] as PlanetName;
      const points = nLord === name ? 5 : FRIENDS[name].includes(nLord) ? 3.75 : 1.25;
      components.push({
        label: "Navamsa (ninth-part lord)", points, max: 5,
        note: `Navamsa ruled by ${nLord}.`,
      });
    }

    const total = Math.round(components.reduce((s, c) => s + c.points, 0) * 100) / 100;
    const vishwa = Math.round((total / 4) * 100) / 100;
    const grade: PanchavargeeyaBala["grade"] =
      vishwa >= 15 ? "very strong" : vishwa >= 10 ? "strong" : vishwa >= 7 ? "moderate" : "weak";
    return { planet: name, components, total, vishwa, grade };
  });
}

export type AnnualPeriod = {
  lord: string;
  start: Date;
  end: Date;
  days: number;
  share: number; // fraction of the year
};

const YEAR_MS = 365.2422 * 86400000;

/**
 * Patyayini Dasha — the classical Tajika year division. Planets (and the
 * annual ascendant) are ordered by the degrees they have travelled inside
 * their sign; each rules a slice of the year proportional to that arc,
 * weighted by its Panchavargeeya strength.
 */
export function computePatyayiniDasha(chart: KundliChart, returnUTC: Date): AnnualPeriod[] {
  const bala = new Map(computePanchavargeeyaBala(chart).map((b) => [b.planet, b.vishwa] as const));
  const rows: { lord: string; arc: number; weight: number }[] = TAJIKA_PLANETS.map((name) => {
    const p = chart.planets.find((x) => x.name === name)!;
    return { lord: name, arc: p.degreeInRashi, weight: bala.get(name) ?? 10 };
  });
  rows.push({
    lord: "Lagna",
    arc: chart.ascendant.degreeInRashi,
    weight: 10,
  });
  rows.sort((a, b) => a.arc - b.arc);

  const scores = rows.map((r) => Math.max(0.5, r.arc) * Math.max(1, r.weight));
  const totalScore = scores.reduce((s, x) => s + x, 0);

  let cursor = returnUTC.getTime();
  return rows.map((r, i) => {
    const share = scores[i] / totalScore;
    const ms = share * YEAR_MS;
    const start = new Date(cursor);
    const end = new Date(cursor + ms);
    cursor += ms;
    return { lord: r.lord, start, end, days: Math.round((ms / 86400000) * 10) / 10, share };
  });
}

/**
 * Mudda Dasha — the Vimshottari sequence compressed into a single solar year,
 * beginning from the lord of the Moon's nakshatra in the annual chart.
 */
export function computeMuddaDasha(chart: KundliChart, returnUTC: Date): AnnualPeriod[] {
  const nakIndex = chart.moonNakshatra.index;
  const startIndex = nakIndex % 9;
  const order = [...DASHA_SEQUENCE.slice(startIndex), ...DASHA_SEQUENCE.slice(0, startIndex)];
  let cursor = returnUTC.getTime();
  return order.map((d) => {
    const share = d.years / DASHA_TOTAL_YEARS;
    const ms = share * YEAR_MS;
    const start = new Date(cursor);
    const end = new Date(cursor + ms);
    cursor += ms;
    return { lord: d.lord, start, end, days: Math.round((ms / 86400000) * 10) / 10, share };
  });
}

export function currentPeriod(periods: AnnualPeriod[], now = new Date()): AnnualPeriod | null {
  return periods.find((p) => now >= p.start && now < p.end) ?? null;
}

const MUNTHA_THEME: Record<number, string> = {
  1: "personal health, appearance and self-direction",
  2: "income, savings and family resources",
  3: "siblings, short travel, courage and communication",
  4: "home, property, vehicles and the mother",
  5: "children, learning, creativity and speculation",
  6: "competition, debts, service and health routines",
  7: "partnership, marriage and negotiation",
  8: "hidden matters, inheritance and deep change",
  9: "fortune, mentors, long travel and belief",
  10: "profession, authority and public standing",
  11: "gains, networks and fulfilled wishes",
  12: "expenditure, letting go, foreign links and rest",
};

export type YearSummary = {
  theme: string;
  supports: string[];
  cautions: string[];
  strongestPlanets: PlanetName[];
  weakestPlanets: PlanetName[];
};

/** A plain-language reading of the annual chart, without jargon or symbols. */
export function summariseYear(
  chart: KundliChart,
  munthaHouse: number,
  varshesh: PlanetName,
  bala: PanchavargeeyaBala[] = computePanchavargeeyaBala(chart),
): YearSummary {
  const sorted = [...bala].sort((a, b) => b.vishwa - a.vishwa);
  const strongestPlanets = sorted.slice(0, 3).map((b) => b.planet);
  const weakestPlanets = sorted.slice(-2).map((b) => b.planet);
  const yearLord = bala.find((b) => b.planet === varshesh);

  const supports: string[] = [
    `The year centres on ${MUNTHA_THEME[munthaHouse]}, because the Muntha has moved into house ${munthaHouse}.`,
    `${strongestPlanets.join(", ")} carry the most strength this year, so matters ruled by them move with less resistance.`,
  ];
  if (yearLord) {
    supports.push(
      `The Lord of the Year, ${varshesh}, scores ${yearLord.vishwa} of 20 and is ${yearLord.grade}, which sets the overall tone.`,
    );
  }
  const cautions: string[] = [
    `${weakestPlanets.join(" and ")} are the weakest points of the annual chart, so anything depending on them needs extra preparation.`,
  ];
  if (yearLord && yearLord.vishwa < 8) {
    cautions.push(
      "The Lord of the Year is weak, so results arrive late rather than not at all. Plan longer timelines for the year's main goal.",
    );
  }
  return {
    theme: `A year about ${MUNTHA_THEME[munthaHouse]}, led by ${varshesh}.`,
    supports, cautions, strongestPlanets, weakestPlanets,
  };
}
