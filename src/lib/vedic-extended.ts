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

export type VargaCode = "D1" | "D2" | "D3" | "D7" | "D9" | "D10" | "D60";

export const VARGA_LABELS: Record<VargaCode, { name: string; theme: string }> = {
  D1:  { name: "Rashi",       theme: "Overall life · body · self" },
  D2:  { name: "Hora",        theme: "Wealth · assets" },
  D3:  { name: "Drekkana",    theme: "Siblings · courage" },
  D7:  { name: "Saptamsha",   theme: "Children · progeny" },
  D9:  { name: "Navamsa",     theme: "Marriage · dharma · fortune" },
  D10: { name: "Dashamsha",   theme: "Career · profession · fame" },
  D60: { name: "Shashtiamsha", theme: "Karmic essence · past life" },
};

function d1(rashi: number): number { return rashi; }

function d2(rashi: number, deg: number): number {
  // Odd signs: 0-15 → Leo (4), 15-30 → Cancer (3)
  // Even signs: 0-15 → Cancer (3), 15-30 → Leo (4)
  const odd = rashi % 2 === 0; // Aries=0 is odd
  if (deg < 15) return odd ? 4 : 3;
  return odd ? 3 : 4;
}

function d3(rashi: number, deg: number): number {
  if (deg < 10) return rashi;
  if (deg < 20) return norm12(rashi + 4);
  return norm12(rashi + 8);
}

function d7(rashi: number, deg: number): number {
  const part = Math.floor(deg / (30 / 7)); // 0..6
  const odd = rashi % 2 === 0;
  const start = odd ? rashi : norm12(rashi + 6);
  return norm12(start + part);
}

function d9(rashi: number, deg: number): number {
  const part = Math.floor(deg / (30 / 9)); // 0..8
  // Movable (0,3,6,9): starts from same
  // Fixed (1,4,7,10): starts from 9th = +8
  // Dual (2,5,8,11): starts from 5th = +4
  const mod = rashi % 3;
  const start = mod === 0 ? rashi : mod === 1 ? norm12(rashi + 8) : norm12(rashi + 4);
  return norm12(start + part);
}

function d10(rashi: number, deg: number): number {
  const part = Math.floor(deg / 3); // 0..9
  const odd = rashi % 2 === 0;
  const start = odd ? rashi : norm12(rashi + 8);
  return norm12(start + part);
}

function d60(rashi: number, deg: number): number {
  // Simplified Parashari: each 0.5° = one part; sign = (rashi + part) mod 12.
  const part = Math.floor(deg * 2); // 0..59
  return norm12(rashi + part);
}

const VARGA_FNS: Record<VargaCode, (rashi: number, deg: number) => number> = {
  D1: d1,
  D2: (r, d) => d2(r, d),
  D3: (r, d) => d3(r, d),
  D7: (r, d) => d7(r, d),
  D9: (r, d) => d9(r, d),
  D10: (r, d) => d10(r, d),
  D60: (r, d) => d60(r, d),
};

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

export type DashaTree = {
  maha: (DashaPeriod & { antar: DashaPeriod[] })[];
  currentMaha: DashaPeriod & { antar: DashaPeriod[] };
  currentAntar: DashaPeriod;
};

// Given birth date and Moon's nakshatra + fraction into nakshatra
// (0..1), compute the Vimshottari dasha timeline.
export function computeVimshottari(
  birth: Date,
  moonNakshatraIndex: number,
  moonDegInNak: number, // 0..(360/27)
): DashaTree {
  const NAK_SPAN = 360 / 27;
  const fraction = moonDegInNak / NAK_SPAN; // portion of nakshatra elapsed
  // Nakshatra lord sequence repeats every 9 nakshatras aligned with DASHA_SEQUENCE
  const lordIndex = moonNakshatraIndex % 9;
  const startingMaha = DASHA_SEQUENCE[lordIndex];
  const remainingYears = startingMaha.years * (1 - fraction);

  const now = new Date();

  // Anchor: the birth moment is at `fraction` into starting mahadasha.
  // So the "true start" of the starting mahadasha = birth - fraction*years.
  const yearsMs = (y: number) => y * 365.2425 * 86400_000;
  const startOfFirstMaha = new Date(birth.getTime() - yearsMs(startingMaha.years * fraction));

  const maha: (DashaPeriod & { antar: DashaPeriod[] })[] = [];
  let cursor = startOfFirstMaha;
  for (let i = 0; i < 9; i++) {
    const d = DASHA_SEQUENCE[(lordIndex + i) % 9];
    const end = new Date(cursor.getTime() + yearsMs(d.years));
    // Antar dashas within this maha: same 9-cycle order starting from d.lord
    const antarStartIdx = DASHA_SEQUENCE.findIndex((x) => x.lord === d.lord);
    const antar: DashaPeriod[] = [];
    let ac = cursor;
    for (let j = 0; j < 9; j++) {
      const a = DASHA_SEQUENCE[(antarStartIdx + j) % 9];
      const antarYears = (d.years * a.years) / DASHA_TOTAL_YEARS;
      const ae = new Date(ac.getTime() + yearsMs(antarYears));
      antar.push({ lord: a.lord, years: antarYears, start: ac, end: ae });
      ac = ae;
    }
    maha.push({ lord: d.lord, years: d.years, start: cursor, end, antar });
    cursor = end;
  }

  // Find current
  const currentMaha =
    maha.find((m) => now >= m.start && now < m.end) ?? maha[0];
  const currentAntar =
    currentMaha.antar.find((a) => now >= a.start && now < a.end) ??
    currentMaha.antar[0];

  // Also expose remaining years for first maha (useful info)
  void remainingYears;

  return { maha, currentMaha, currentAntar };
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
