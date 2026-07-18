// Tajika deep engine — Tajika aspects, Ithasala / Isarapha / Nakta / Yamaya /
// Kambool yogas, Muntha-Varshesh relationship, and Harsha Bala.
//
// References: Tajika Neelakanthi (Neelakantha Daivagya, c. 1587) and standard
// modern Tajika treatments (K.S. Charak, B.V. Raman "Annual Horoscope").

import type { KundliChart, PlanetName } from "./vedic";
import { RASHIS, RASHI_LORDS } from "./vedic";

const norm360 = (x: number) => ((x % 360) + 360) % 360;

// Mean daily motion in degrees (unsigned magnitudes; sign is retrograde-aware).
const MEAN_MOTION: Record<PlanetName, number> = {
  Sun: 0.9856, Moon: 13.1764, Mercury: 1.383, Venus: 1.2,
  Mars: 0.524, Jupiter: 0.0831, Saturn: 0.0335,
  Rahu: 0.0529, Ketu: 0.0529,
};

// Deeptamsha orbs (traditional Tajika).
const DEEPTAMSHA: Record<PlanetName, number> = {
  Sun: 15, Moon: 12, Mars: 8, Mercury: 7, Jupiter: 9,
  Venus: 7, Saturn: 9, Rahu: 5, Ketu: 5,
};

// Tajika aspects — unlike Vedic drishti, these are Ptolemaic + full-strength.
export const TAJIKA_ASPECTS: { angle: number; name: string; nature: "friend" | "enemy" | "neutral" }[] = [
  { angle: 0,   name: "Conjunction",  nature: "neutral" },
  { angle: 60,  name: "Sextile",      nature: "friend" },
  { angle: 90,  name: "Square",       nature: "enemy" },
  { angle: 120, name: "Trine",        nature: "friend" },
  { angle: 180, name: "Opposition",   nature: "enemy" },
  { angle: 240, name: "Trine (L)",    nature: "friend" },
  { angle: 270, name: "Square (L)",   nature: "enemy" },
  { angle: 300, name: "Sextile (L)",  nature: "friend" },
];

// Exaltation sign index (0=Aries) and degree.
const EXALTATION: Partial<Record<PlanetName, { rashi: number; deg: number }>> = {
  Sun:     { rashi: 0,  deg: 10 },   // Aries 10°
  Moon:    { rashi: 1,  deg: 3 },    // Taurus 3°
  Mars:    { rashi: 9,  deg: 28 },   // Capricorn 28°
  Mercury: { rashi: 5,  deg: 15 },   // Virgo 15°
  Jupiter: { rashi: 3,  deg: 5 },    // Cancer 5°
  Venus:   { rashi: 11, deg: 27 },   // Pisces 27°
  Saturn:  { rashi: 6,  deg: 20 },   // Libra 20°
};

const OWN_SIGNS: Partial<Record<PlanetName, number[]>> = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5],
  Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
};

// Egyptian terms (Hadda) — degrees at which each term ends within a sign,
// paired with the ruling planet. Rahu/Ketu don't have terms.
const HADDA: [PlanetName, number][][] = [
  // Aries
  [["Jupiter",6],["Venus",12],["Mercury",20],["Mars",25],["Saturn",30]],
  // Taurus
  [["Venus",8],["Mercury",14],["Jupiter",22],["Saturn",27],["Mars",30]],
  // Gemini
  [["Mercury",6],["Jupiter",12],["Venus",17],["Mars",24],["Saturn",30]],
  // Cancer
  [["Mars",7],["Venus",13],["Mercury",19],["Jupiter",26],["Saturn",30]],
  // Leo
  [["Jupiter",6],["Venus",11],["Saturn",18],["Mercury",24],["Mars",30]],
  // Virgo
  [["Mercury",7],["Venus",17],["Jupiter",21],["Mars",28],["Saturn",30]],
  // Libra
  [["Saturn",6],["Mercury",14],["Jupiter",21],["Venus",28],["Mars",30]],
  // Scorpio
  [["Mars",7],["Venus",11],["Mercury",19],["Jupiter",24],["Saturn",30]],
  // Sagittarius
  [["Jupiter",12],["Venus",17],["Mercury",21],["Saturn",26],["Mars",30]],
  // Capricorn
  [["Mercury",7],["Jupiter",14],["Venus",22],["Saturn",26],["Mars",30]],
  // Aquarius
  [["Mercury",7],["Venus",13],["Jupiter",20],["Mars",25],["Saturn",30]],
  // Pisces
  [["Venus",12],["Jupiter",16],["Mercury",19],["Mars",28],["Saturn",30]],
];

function haddaLord(rashi: number, degInRashi: number): PlanetName | null {
  const rows = HADDA[rashi];
  for (const [lord, end] of rows) if (degInRashi < end) return lord;
  return null;
}

// Signed daily motion (retrograde ⇒ negative).
function signedMotion(name: PlanetName, retro: boolean): number {
  const m = MEAN_MOTION[name];
  // Rahu/Ketu are always retrograde in Vedic frame — treat as negative.
  if (name === "Rahu" || name === "Ketu") return -m;
  return retro ? -m : m;
}

// Combined deeptamsha orb between two planets.
function combinedOrb(a: PlanetName, b: PlanetName) {
  return (DEEPTAMSHA[a] + DEEPTAMSHA[b]) / 2;
}

export type TajikaAspect = {
  from: PlanetName;
  to: PlanetName;
  aspect: string;
  angle: number;             // canonical aspect angle
  orbDeg: number;            // absolute deviation from exact
  applying: boolean;         // faster catching up to exact
  strength: number;          // 0..1 — closer to exact = higher
  nature: "friend" | "enemy" | "neutral";
};

/** All Tajika aspects between planets within combined deeptamsha orb. */
export function computeTajikaAspects(chart: KundliChart): TajikaAspect[] {
  const out: TajikaAspect[] = [];
  const pl = chart.planets;
  for (let i = 0; i < pl.length; i++) {
    for (let j = i + 1; j < pl.length; j++) {
      const A = pl[i], B = pl[j];
      // Signed relative motion (A - B).
      const mA = signedMotion(A.name, A.retrograde);
      const mB = signedMotion(B.name, B.retrograde);
      const relMotion = mA - mB;
      // Skip zero-motion oddity.
      if (relMotion === 0) continue;
      // Ensure "faster" is the one moving positively toward the other.
      const fast = relMotion > 0 ? A : B;
      const slow = relMotion > 0 ? B : A;
      const relSpeed = Math.abs(relMotion);

      const orb = combinedOrb(fast.name, slow.name);
      const phi = norm360(fast.longitude - slow.longitude);

      for (const asp of TAJIKA_ASPECTS) {
        // Signed distance to aspect (positive ⇒ fast past aspect ⇒ separating).
        let delta = phi - asp.angle;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        const orbDeg = Math.abs(delta);
        if (orbDeg > orb) continue;
        // Applying: relative motion (positive) with delta negative means fast
        // is still catching up to aspect. So applying ⇔ delta < 0.
        const applying = delta < 0 && relSpeed > 0;
        const strength = Math.max(0, 1 - orbDeg / orb);
        out.push({
          from: fast.name,
          to: slow.name,
          aspect: asp.name,
          angle: asp.angle,
          orbDeg,
          applying,
          strength,
          nature: asp.nature,
        });
      }
    }
  }
  out.sort((a, b) => b.strength - a.strength);
  return out;
}

export type TajikaYoga = {
  name: string;
  planets: PlanetName[];
  aspect: string;
  quality: "benefic" | "malefic" | "neutral";
  strength: number;
  description: string;
};

/** Detect the core Tajika applying / separating yogas. */
export function detectTajikaYogas(aspects: TajikaAspect[]): TajikaYoga[] {
  const yogas: TajikaYoga[] = [];
  for (const a of aspects) {
    const kind = a.applying ? "Ithasala" : "Isarapha";
    const quality: "benefic" | "malefic" | "neutral" =
      kind === "Ithasala"
        ? a.nature === "enemy" ? "malefic" : "benefic"
        : "malefic"; // Isarapha = result already past — generally poor
    yogas.push({
      name: kind + (a.nature === "friend" ? " (friendly)" : a.nature === "enemy" ? " (obstructed)" : ""),
      planets: [a.from, a.to],
      aspect: a.aspect,
      quality,
      strength: a.strength,
      description:
        kind === "Ithasala"
          ? `${a.from} is applying to ${a.aspect.toLowerCase()} with ${a.to} — result approaching, ${a.nature === "enemy" ? "under strain" : "with support"}.`
          : `${a.from} has just separated from ${a.aspect.toLowerCase()} with ${a.to} — matter already peaked.`,
    });
  }
  return yogas;
}

/** Kambool yoga — Moon in Ithasala with any other planet. Powerful in Tajika. */
export function detectKambool(aspects: TajikaAspect[]): TajikaYoga[] {
  return aspects
    .filter((a) => (a.from === "Moon" || a.to === "Moon") && a.applying)
    .map((a) => {
      const other = a.from === "Moon" ? a.to : a.from;
      return {
        name: "Kambool",
        planets: ["Moon" as PlanetName, other],
        aspect: a.aspect,
        quality: a.nature === "enemy" ? "malefic" : "benefic",
        strength: a.strength,
        description: `Moon-${other} applying ${a.aspect.toLowerCase()} — Kambool. ${other}'s theme comes strongly to the year's emotional life.`,
      } as TajikaYoga;
    });
}

/** Muntha ↔ Varshesh relationship: distance and Tajika aspect if any. */
export function munthaVarsheshLink(
  chart: KundliChart,
  munthaLon: number,
  varshesh: PlanetName,
): { angleDeg: number; aspect?: string; nature?: string } {
  const v = chart.planets.find((p) => p.name === varshesh);
  if (!v) return { angleDeg: 0 };
  const phi = norm360(v.longitude - munthaLon);
  const dist = Math.min(phi, 360 - phi);
  let closest: (typeof TAJIKA_ASPECTS)[number] | undefined;
  let bestOrb = 999;
  for (const asp of TAJIKA_ASPECTS.slice(0, 5)) {
    const d = Math.abs(dist - asp.angle);
    if (d < bestOrb && d < 8) { bestOrb = d; closest = asp; }
  }
  return {
    angleDeg: dist,
    aspect: closest?.name,
    nature: closest?.nature,
  };
}

export type HarshaSource = { label: string; points: number; hit: boolean };
export type HarshaScore = {
  planet: PlanetName;
  total: number;         // 0..25 (5 sources × 5 points)
  sources: HarshaSource[];
};

function isDayChart(chart: KundliChart): boolean {
  const sun = chart.planets.find((p) => p.name === "Sun")!;
  const houseNum = ((sun.rashi - chart.ascendant.rashi + 12) % 12) + 1;
  return houseNum >= 7 && houseNum <= 12;
}

// Traditional sect: diurnal = Sun, Jupiter, Saturn; nocturnal = Moon, Venus, Mars.
const DIURNAL: PlanetName[] = ["Sun", "Jupiter", "Saturn"];
const NOCTURNAL: PlanetName[] = ["Moon", "Venus", "Mars"];

/** Harsha Bala — 5 sources of 5 points each (Kshetra, Uchcha, Hadda,
 *  Drekkana / own decan, Sunlight / sect). Rahu & Ketu use a reduced scheme. */
export function computeHarshaBala(chart: KundliChart): HarshaScore[] {
  const day = isDayChart(chart);
  return chart.planets.map((p) => {
    const sources: HarshaSource[] = [];

    // 1. Kshetra — own sign
    const kshetra = (OWN_SIGNS[p.name] ?? []).includes(p.rashi);
    sources.push({ label: "Kshetra (own sign)", points: kshetra ? 5 : 0, hit: kshetra });

    // 2. Uchcha — exalted (within ±5° of exact deg = full 5, else scaled)
    const ex = EXALTATION[p.name];
    let uchchaHit = false, uchchaPts = 0;
    if (ex && p.rashi === ex.rashi) {
      const off = Math.abs(p.degreeInRashi - ex.deg);
      uchchaPts = off < 5 ? 5 : off < 15 ? 3 : 1;
      uchchaHit = true;
    }
    sources.push({ label: "Uchcha (exaltation)", points: uchchaPts, hit: uchchaHit });

    // 3. Hadda — Egyptian term lord equals planet
    const lord = haddaLord(p.rashi, p.degreeInRashi);
    const haddaHit = lord === p.name;
    sources.push({ label: "Hadda (own term)", points: haddaHit ? 5 : 0, hit: haddaHit });

    // 4. Drekkana / decan — sign lord of decan 1/2/3 = decan of Aries/Leo/Sag pattern
    // Approximate: decan lord = sign lord of the sign 0/4/8 rashis ahead.
    const decan = Math.floor(p.degreeInRashi / 10); // 0,1,2
    const decanRashi = (p.rashi + decan * 4) % 12;
    const decanLord = RASHI_LORDS[decanRashi] as PlanetName;
    const decanHit = decanLord === p.name;
    sources.push({ label: "Drekkana (own decan)", points: decanHit ? 5 : 0, hit: decanHit });

    // 5. Sunlight / Sect
    let sectHit = false;
    if (DIURNAL.includes(p.name)) sectHit = day;
    else if (NOCTURNAL.includes(p.name)) sectHit = !day;
    else if (p.name === "Mercury") sectHit = true; // Mercury takes on sect of chart
    else sectHit = false; // Rahu/Ketu — no sect
    sources.push({ label: "Sunlight (sect)", points: sectHit ? 5 : 0, hit: sectHit });

    const total = sources.reduce((s, x) => s + x.points, 0);
    return { planet: p.name, total, sources };
  });
}
