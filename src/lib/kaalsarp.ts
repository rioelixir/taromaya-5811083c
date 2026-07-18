// Kaal Sarp Dosha detector.
// Present when all 7 grahas (Sun..Saturn) fall in the semicircle from Rahu to
// Ketu (or vice-versa). 12 named variants by Rahu's bhava.

import type { KundliChart, PlanetName } from "./vedic";

export const KAALSARP_TYPES = [
  "Anant","Kulik","Vasuki","Shankhapal","Padma","Mahapadma",
  "Takshak","Karkotak","Shankhachud","Ghatak","Vishdhara","Sheshnag",
] as const;
export type KaalSarpType = (typeof KAALSARP_TYPES)[number];

const HOUSE_MEANING: Record<number, string> = {
  1: "Identity, health, self — struggles feel personal.",
  2: "Family, speech and wealth — hard-earned resources.",
  3: "Courage, siblings, communication — must earn boldness.",
  4: "Home, mother, emotional peace — delays in property.",
  5: "Progeny, creativity, romance — creative blocks or child delays.",
  6: "Debts, enemies, health — service brings karmic release.",
  7: "Partnerships, marriage — karmic marriage patterns.",
  8: "Longevity, occult, sudden shifts — deep transformation.",
  9: "Dharma, luck, guru — spiritual awakening after tests.",
  10: "Career, status, dharma — public karma is intense.",
  11: "Gains, elder siblings — gains after long labour.",
  12: "Loss, moksha, foreign lands — expenses drain, but liberation ripens.",
};

export type KaalSarpReport = {
  present: boolean;
  partial: boolean;             // one planet just outside the axis
  type: KaalSarpType | null;    // classical name if present
  rahuHouse: number;
  ketuHouse: number;
  direction: "Rahu→Ketu" | "Ketu→Rahu" | null;
  planetsInsideAxis: PlanetName[];
  planetsOutside: PlanetName[];
  houseMeaning: string;
  remedies: string[];
};

const norm360 = (x: number) => ((x % 360) + 360) % 360;

function isBetweenCCW(x: number, a: number, b: number): boolean {
  // Is longitude x on the CCW arc from a to b (exclusive endpoints)?
  const A = norm360(a), B = norm360(b), X = norm360(x);
  const span = norm360(B - A);
  const off  = norm360(X - A);
  return off > 0.0001 && off < span - 0.0001;
}

function houseOf(chart: KundliChart, planet: PlanetName): number {
  const p = chart.planets.find((x) => x.name === planet);
  if (!p) return 1;
  return ((p.rashi - chart.ascendant.rashi + 12) % 12) + 1;
}

export function analyzeKaalSarp(chart: KundliChart): KaalSarpReport {
  const rahu = chart.planets.find((p) => p.name === "Rahu")!;
  const ketu = chart.planets.find((p) => p.name === "Ketu")!;
  const others = chart.planets.filter(
    (p) => p.name !== "Rahu" && p.name !== "Ketu",
  );

  // Two candidate arcs (Rahu→Ketu vs Ketu→Rahu). The classical dosha requires
  // all 7 grahas to sit inside one of them.
  const rahuKetu = others.filter((p) => isBetweenCCW(p.longitude, rahu.longitude, ketu.longitude));
  const ketuRahu = others.filter((p) => isBetweenCCW(p.longitude, ketu.longitude, rahu.longitude));

  let direction: KaalSarpReport["direction"] = null;
  let insideNames: PlanetName[] = [];
  let outsideNames: PlanetName[] = [];
  let present = false;
  let partial = false;

  if (rahuKetu.length === 7) {
    direction = "Rahu→Ketu"; insideNames = rahuKetu.map((p) => p.name);
    present = true;
  } else if (ketuRahu.length === 7) {
    direction = "Ketu→Rahu"; insideNames = ketuRahu.map((p) => p.name);
    present = true;
  } else if (rahuKetu.length === 6) {
    partial = true; direction = "Rahu→Ketu";
    insideNames = rahuKetu.map((p) => p.name);
    outsideNames = others.filter((p) => !rahuKetu.includes(p)).map((p) => p.name);
  } else if (ketuRahu.length === 6) {
    partial = true; direction = "Ketu→Rahu";
    insideNames = ketuRahu.map((p) => p.name);
    outsideNames = others.filter((p) => !ketuRahu.includes(p)).map((p) => p.name);
  }

  const rahuHouse = houseOf(chart, "Rahu");
  const ketuHouse = houseOf(chart, "Ketu");
  const type = present ? KAALSARP_TYPES[rahuHouse - 1] : null;

  const remedies = present
    ? [
        "Chant Maha Mrityunjaya mantra 108 times daily for 43 days.",
        "Perform Kaal Sarp Puja at Trimbakeshwar or a Nag temple on Nag Panchami.",
        "Offer milk to a Shiva Lingam on every Sawan Monday.",
        "Donate silver Nag-Nagin idols into flowing water on an amavasya.",
        "Fast on Panchami tithi and worship Naga Devatas.",
      ]
    : partial
    ? [
        "Ardha (partial) Kaal Sarp — soft remedies suffice.",
        "Chant Om Namah Shivaya 108 times daily.",
        "Offer water to a Shivalinga each Monday.",
      ]
    : ["No Kaal Sarp Dosha detected — no remedy required."];

  return {
    present, partial, type, rahuHouse, ketuHouse, direction,
    planetsInsideAxis: insideNames,
    planetsOutside: outsideNames,
    houseMeaning: HOUSE_MEANING[rahuHouse] ?? "",
    remedies,
  };
}
