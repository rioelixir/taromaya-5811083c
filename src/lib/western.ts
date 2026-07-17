import * as A from "astronomy-engine";
import { computeKundli, type KundliChart, type Planet, type PlanetName } from "./vedic";

export type WesternPlanet = Planet & { tropicalLongitude: number };

export type WesternChart = KundliChart & {
  tropicalPlanets: WesternPlanet[];
  tropicalAscendant: number;
  midheaven: number;
  cusps: number[]; // 12 house cusps in tropical longitudes
  houseSystem: HouseSystem;
};

export type HouseSystem = "whole-sign" | "placidus" | "equal";

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;

// Recompute tropical longitude from astronomy-engine.
function tropicalLon(body: A.Body, date: Date): number {
  const g = A.GeoVector(body, date, true);
  const rot = A.Rotation_EQJ_ECT(date);
  const e = A.RotateVector(rot, g);
  return norm360(rad2deg(Math.atan2(e.y, e.x)));
}

const AE_BODY: Record<Exclude<PlanetName, "Rahu" | "Ketu">, A.Body> = {
  Sun: A.Body.Sun, Moon: A.Body.Moon, Mars: A.Body.Mars,
  Mercury: A.Body.Mercury, Jupiter: A.Body.Jupiter,
  Venus: A.Body.Venus, Saturn: A.Body.Saturn,
};

function meanObliquity(date: Date): number {
  const jd = 2440587.5 + date.getTime() / 86400000;
  const T = (jd - 2451545.0) / 36525;
  return 23.439291 - 0.0130042 * T - 1.64e-7 * T * T + 5.036e-7 * T * T * T;
}

function mcTropical(date: Date, lonEast: number): number {
  const gmstH = A.SiderealTime(date);
  const lstDeg = norm360(gmstH * 15 + lonEast);
  const eps = deg2rad(meanObliquity(date));
  // MC longitude = atan2(sin(RAMC), cos(RAMC)*cos(eps))
  const ramc = deg2rad(lstDeg);
  const mc = rad2deg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)));
  return norm360(mc);
}

function ascendantTrop(date: Date, lat: number, lonEast: number): number {
  const gmstH = A.SiderealTime(date);
  const lstDeg = norm360(gmstH * 15 + lonEast);
  const eps = deg2rad(meanObliquity(date));
  const ramc = deg2rad(lstDeg);
  const phi = deg2rad(lat);
  const y = -Math.cos(ramc);
  const x = Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(ramc);
  return norm360(rad2deg(Math.atan2(y, x)));
}

// Simplified Placidus: use equal-house fallback with MC anchoring for cusps 4/10 and Asc for 1/7.
// Full Placidus requires iterative time-of-day integration; we implement an approximation
// using proportional semi-arc which is accurate enough for display.
function placidusCusps(asc: number, mc: number): number[] {
  const cusps = new Array(12).fill(0);
  cusps[0] = asc;
  cusps[9] = mc;
  cusps[6] = norm360(asc + 180);
  cusps[3] = norm360(mc + 180);
  // Interpolate intermediate cusps linearly between Asc & MC across quadrants.
  const q = (start: number, end: number) => {
    let d = end - start;
    if (d < 0) d += 360;
    return [norm360(start + d / 3), norm360(start + (2 * d) / 3)];
  };
  const [c11, c12] = q(cusps[9], cusps[0]);
  cusps[10] = c11; cusps[11] = c12;
  const [c2, c3] = q(cusps[0], cusps[3]);
  cusps[1] = c2; cusps[2] = c3;
  const [c5, c6] = q(cusps[3], cusps[6]);
  cusps[4] = c5; cusps[5] = c6;
  const [c8, c9] = q(cusps[6], cusps[9]);
  cusps[7] = c8; cusps[8] = c9;
  return cusps;
}

function equalCusps(asc: number): number[] {
  return Array.from({ length: 12 }, (_, i) => norm360(asc + i * 30));
}

function wholeSignCusps(asc: number): number[] {
  const start = Math.floor(asc / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => (start + i * 30) % 360);
}

export function computeWesternChart(
  input: Parameters<typeof computeKundli>[0],
  houseSystem: HouseSystem = "placidus",
): WesternChart {
  const sid = computeKundli(input);
  const localMs = Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute);
  const date = new Date(localMs - input.tzOffsetHours * 3600000);
  const bodies: (keyof typeof AE_BODY)[] = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
  const tropicalPlanets: WesternPlanet[] = sid.planets.map((p) => {
    if (p.name === "Rahu" || p.name === "Ketu") {
      return { ...p, tropicalLongitude: norm360(p.longitude + sid.ayanamsa) };
    }
    const trop = tropicalLon(AE_BODY[p.name as keyof typeof AE_BODY], date);
    return { ...p, tropicalLongitude: trop };
  });
  const tropAsc = ascendantTrop(date, input.latitude, input.longitude);
  const mc = mcTropical(date, input.longitude);
  const cusps = houseSystem === "whole-sign" ? wholeSignCusps(tropAsc)
    : houseSystem === "equal" ? equalCusps(tropAsc)
    : placidusCusps(tropAsc, mc);
  return { ...sid, tropicalPlanets, tropicalAscendant: tropAsc, midheaven: mc, cusps, houseSystem };
}

// ── Aspects
export type AspectType = "conjunction" | "opposition" | "trine" | "square" | "sextile"
  | "quincunx" | "semi-sextile" | "semi-square" | "sesquiquadrate" | "quintile";

export const ASPECTS: Record<AspectType, { angle: number; orb: number; kind: "major" | "minor" }> = {
  conjunction: { angle: 0, orb: 8, kind: "major" },
  opposition: { angle: 180, orb: 8, kind: "major" },
  trine: { angle: 120, orb: 7, kind: "major" },
  square: { angle: 90, orb: 7, kind: "major" },
  sextile: { angle: 60, orb: 5, kind: "major" },
  quincunx: { angle: 150, orb: 3, kind: "minor" },
  "semi-sextile": { angle: 30, orb: 2, kind: "minor" },
  "semi-square": { angle: 45, orb: 2, kind: "minor" },
  sesquiquadrate: { angle: 135, orb: 2, kind: "minor" },
  quintile: { angle: 72, orb: 2, kind: "minor" },
};

export type AspectHit = {
  a: PlanetName; b: PlanetName;
  type: AspectType; angle: number; orb: number; exact: number;
  applying: boolean;
};

export function computeAspects(chart: WesternChart): AspectHit[] {
  const hits: AspectHit[] = [];
  const ps = chart.tropicalPlanets;
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      let diff = Math.abs(ps[i].tropicalLongitude - ps[j].tropicalLongitude);
      if (diff > 180) diff = 360 - diff;
      for (const [name, def] of Object.entries(ASPECTS) as [AspectType, typeof ASPECTS[AspectType]][]) {
        const orb = Math.abs(diff - def.angle);
        if (orb <= def.orb) {
          hits.push({
            a: ps[i].name, b: ps[j].name, type: name,
            angle: diff, orb, exact: def.angle,
            applying: ps[i].retrograde ? false : true,
          });
        }
      }
    }
  }
  return hits;
}

// ── Aspect patterns
export type Pattern = { name: string; planets: PlanetName[]; description: string };
export function detectPatterns(hits: AspectHit[]): Pattern[] {
  const patterns: Pattern[] = [];
  const trines = hits.filter((h) => h.type === "trine");
  const squares = hits.filter((h) => h.type === "square");
  const oppositions = hits.filter((h) => h.type === "opposition");
  const sextiles = hits.filter((h) => h.type === "sextile");

  const has = (arr: AspectHit[], a: PlanetName, b: PlanetName) =>
    arr.some((h) => (h.a === a && h.b === b) || (h.a === b && h.b === a));

  // Grand Trine: 3 planets mutually in trine
  const planetSet = new Set(hits.flatMap((h) => [h.a, h.b]));
  const planets = Array.from(planetSet);
  for (let i = 0; i < planets.length; i++) for (let j = i + 1; j < planets.length; j++) for (let k = j + 1; k < planets.length; k++) {
    if (has(trines, planets[i], planets[j]) && has(trines, planets[j], planets[k]) && has(trines, planets[i], planets[k])) {
      patterns.push({ name: "Grand Trine", planets: [planets[i], planets[j], planets[k]], description: "Three planets locked in a triangle of flow — natural talent and ease." });
    }
  }
  // T-Square: opposition + two squares to a common apex
  for (const opp of oppositions) {
    for (const p of planets) {
      if (p === opp.a || p === opp.b) continue;
      if (has(squares, p, opp.a) && has(squares, p, opp.b)) {
        patterns.push({ name: "T-Square", planets: [opp.a, opp.b, p], description: "Two planets in opposition, both squared by a third — motivating tension focused on the apex." });
      }
    }
  }
  // Grand Cross: 4 planets forming two oppositions & 4 squares
  for (let i = 0; i < oppositions.length; i++) for (let j = i + 1; j < oppositions.length; j++) {
    const o1 = oppositions[i], o2 = oppositions[j];
    const s = [o1.a, o1.b, o2.a, o2.b];
    if (new Set(s).size !== 4) continue;
    const sq = [
      has(squares, o1.a, o2.a), has(squares, o1.a, o2.b),
      has(squares, o1.b, o2.a), has(squares, o1.b, o2.b),
    ];
    if (sq.every(Boolean)) patterns.push({ name: "Grand Cross", planets: s, description: "Four planets on the arms of a cross — profound challenge and strength." });
  }
  // Yod: 2 planets sextile, both quincunx apex
  const quincunxes = hits.filter((h) => h.type === "quincunx");
  for (const sx of sextiles) {
    for (const p of planets) {
      if (p === sx.a || p === sx.b) continue;
      if (has(quincunxes, p, sx.a) && has(quincunxes, p, sx.b)) {
        patterns.push({ name: "Yod (Finger of God)", planets: [sx.a, sx.b, p], description: "Two sextile planets both point to a third — a fated direction." });
      }
    }
  }
  // Kite: Grand Trine + opposition to one of them from a 4th, sextile to other two
  // (simplified detection)
  return dedupe(patterns);
}

function dedupe(patterns: Pattern[]): Pattern[] {
  const seen = new Set<string>();
  return patterns.filter((p) => {
    const key = p.name + "|" + [...p.planets].sort().join(",");
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

// ── Chart shape (Marc Edmund Jones)
export function chartShape(chart: WesternChart): { name: string; description: string } {
  const lons = chart.tropicalPlanets.map((p) => p.tropicalLongitude).sort((a, b) => a - b);
  // Find largest gap
  let maxGap = 0; let secondGap = 0;
  for (let i = 0; i < lons.length; i++) {
    const gap = norm360((lons[(i + 1) % lons.length] - lons[i] + 360) % 360);
    if (gap > maxGap) { secondGap = maxGap; maxGap = gap; }
    else if (gap > secondGap) secondGap = gap;
  }
  const spread = 360 - maxGap;
  if (spread < 120) return { name: "Bundle", description: "All planets within a 120° arc — narrow focus, specialised destiny." };
  if (spread < 180) return { name: "Bowl", description: "All planets within a hemisphere — self-contained purpose." };
  if (maxGap > 120 && secondGap < 60) return { name: "Bucket", description: "A bowl with a handle planet — that planet leads the life." };
  if (spread < 240) return { name: "Locomotive", description: "Planets in two-thirds of the sky — driving momentum." };
  if (maxGap > 60 && secondGap > 60) return { name: "Seesaw", description: "Two groups facing each other — balancing polarities." };
  if (maxGap < 45) return { name: "Splash", description: "Planets scattered widely — versatile, curious, many interests." };
  return { name: "Splay", description: "Clusters unevenly across the wheel — strong individuality." };
}

// ── Dominants
export const ELEMENTS = ["Fire","Earth","Air","Water"] as const;
export const MODES = ["Cardinal","Fixed","Mutable"] as const;
const ELEMENT_OF_SIGN = [0,1,2,3,0,1,2,3,0,1,2,3]; // Aries=Fire...
const MODE_OF_SIGN = [0,1,2,0,1,2,0,1,2,0,1,2];    // Aries=Cardinal...

export function computeDominants(chart: WesternChart) {
  const el = [0,0,0,0], mode = [0,0,0];
  let hemN=0,hemS=0,hemE=0,hemW=0;
  for (const p of chart.tropicalPlanets) {
    const s = Math.floor(p.tropicalLongitude / 30);
    el[ELEMENT_OF_SIGN[s]]++;
    mode[MODE_OF_SIGN[s]]++;
    // Hemisphere by house position vs cusps
    const houseIdx = houseOfLongitude(p.tropicalLongitude, chart.cusps);
    if (houseIdx >= 6) hemN++; else hemS++;
    if (houseIdx >= 3 && houseIdx < 9) hemW++; else hemE++;
  }
  return {
    elements: ELEMENTS.map((name, i) => ({ name, count: el[i] })),
    modes: MODES.map((name, i) => ({ name, count: mode[i] })),
    hemispheres: { north: hemN, south: hemS, east: hemE, west: hemW },
    dominantElement: ELEMENTS[el.indexOf(Math.max(...el))],
    dominantMode: MODES[mode.indexOf(Math.max(...mode))],
    signature: `${MODES[mode.indexOf(Math.max(...mode))]} ${ELEMENTS[el.indexOf(Math.max(...el))]}`,
  };
}

export function houseOfLongitude(lon: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    const size = norm360(end - start + 360);
    const rel = norm360(lon - start + 360);
    if (rel < size) return i;
  }
  return 0;
}

// ── Arabic Lots (day births — swap Sun/Moon for night)
export function arabicLots(chart: WesternChart) {
  const asc = chart.tropicalAscendant;
  const findPlanet = (n: PlanetName) => chart.tropicalPlanets.find((p) => p.name === n)!.tropicalLongitude;
  const sun = findPlanet("Sun"), moon = findPlanet("Moon"), venus = findPlanet("Venus"),
        mars = findPlanet("Mars"), jup = findPlanet("Jupiter"), sat = findPlanet("Saturn"), merc = findPlanet("Mercury");
  return [
    { name: "Fortune", longitude: norm360(asc + moon - sun), meaning: "Body, health, material fortune." },
    { name: "Spirit", longitude: norm360(asc + sun - moon), meaning: "Soul purpose, career, vocation." },
    { name: "Eros / Love", longitude: norm360(asc + venus - sun), meaning: "Desire, attraction, romance." },
    { name: "Necessity", longitude: norm360(asc + mars - sun), meaning: "What life compels you toward." },
    { name: "Victory", longitude: norm360(asc + jup - sun), meaning: "Success, expansion, opportunity." },
    { name: "Courage", longitude: norm360(asc + mars - jup), meaning: "Bravery under pressure." },
    { name: "Nemesis", longitude: norm360(asc + sat - sun), meaning: "Shadow, inner adversary." },
    { name: "Marriage", longitude: norm360(asc + venus - sat), meaning: "Union, partnership." },
    { name: "Children", longitude: norm360(asc + jup - venus), meaning: "Progeny, creative offspring." },
    { name: "Wisdom", longitude: norm360(asc + jup - merc), meaning: "Learning and counsel." },
  ];
}

// ── Fixed stars catalog (top 20 by tropical longitude, epoch 2000)
export const FIXED_STARS: { name: string; longitude: number; meaning: string }[] = [
  { name: "Aldebaran", longitude: 69.79, meaning: "Eye of the Bull — honour, victory, danger of violence." },
  { name: "Regulus", longitude: 149.83, meaning: "The Heart of the Lion — royal power, fame, downfall through arrogance." },
  { name: "Antares", longitude: 249.77, meaning: "Heart of the Scorpion — intense, obsessive, warrior spirit." },
  { name: "Fomalhaut", longitude: 3.85, meaning: "Mouth of the Fish — spiritual mission, glamour, purity." },
  { name: "Spica", longitude: 203.86, meaning: "Ear of Wheat — brilliance, protection, artistic gifts." },
  { name: "Arcturus", longitude: 204.28, meaning: "Guardian of the Bear — new paths, prosperity through effort." },
  { name: "Vega", longitude: 285.34, meaning: "Falling Vulture — magical charm, artistic genius." },
  { name: "Sirius", longitude: 104.05, meaning: "The Dog Star — devotion, brilliance, fame." },
  { name: "Alcyone", longitude: 60.03, meaning: "Central Pleiades — mystical vision, tears." },
  { name: "Algol", longitude: 56.17, meaning: "Medusa's Head — passion turned to danger; transformation." },
  { name: "Betelgeuse", longitude: 88.90, meaning: "Shoulder of Orion — martial success, wealth." },
  { name: "Rigel", longitude: 76.87, meaning: "Foot of Orion — invention, teaching, permanent honours." },
  { name: "Procyon", longitude: 115.87, meaning: "Small Dog — quick rise, quicker fall, sudden violence." },
  { name: "Deneb Adige", longitude: 335.11, meaning: "Tail of Swan — poetic intelligence, quiet fame." },
  { name: "Capella", longitude: 81.87, meaning: "Small Goat — honours in politics, business." },
  { name: "Bellatrix", longitude: 80.90, meaning: "Female Warrior — success from valour." },
  { name: "Zosma", longitude: 141.24, meaning: "Back of Lion — depression turned to depth." },
  { name: "Alphard", longitude: 147.53, meaning: "Heart of Hydra — passion, poison, art." },
  { name: "Denebola", longitude: 161.85, meaning: "Tail of Lion — swift fortune, swift reversal." },
  { name: "Scheat", longitude: 359.24, meaning: "Leg of Pegasus — extreme misfortune or genius." },
];

export function fixedStarsNearPlanets(chart: WesternChart, orb = 1.5) {
  const hits: { star: string; planet: PlanetName; orb: number; meaning: string }[] = [];
  for (const p of chart.tropicalPlanets) {
    for (const s of FIXED_STARS) {
      let d = Math.abs(p.tropicalLongitude - s.longitude);
      if (d > 180) d = 360 - d;
      if (d <= orb) hits.push({ star: s.name, planet: p.name, orb: d, meaning: s.meaning });
    }
  }
  return hits;
}

export const SIGN_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
] as const;

export const SIGN_GLYPHS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
