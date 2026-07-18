// Deep Western astrology extensions: Solar Arc directions, Harmonics, and
// Ebertin-style Midpoint (cosmobiology) trees.
import type { WesternChart } from "./western";
import * as A from "astronomy-engine";

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const rad2deg = (r: number) => (r * 180) / Math.PI;

// --- Solar Arc directions ---
// Every planet is advanced by the same arc = distance the natal Sun has
// travelled by secondary progression at target age. Angles advance too.
function sunTropicalLon(date: Date): number {
  const g = A.GeoVector(A.Body.Sun, date, true);
  const rot = A.Rotation_EQJ_ECT(date);
  const e = A.RotateVector(rot, g);
  return norm360(rad2deg(Math.atan2(e.y, e.x)));
}

export function solarArcDirections(natal: WesternChart, birthUtcMs: number, target: Date = new Date()) {
  const ageYears = (target.getTime() - birthUtcMs) / (365.2422 * 86400000);
  const progressedInstant = new Date(birthUtcMs + ageYears * 86400000);
  const natalSun = natal.tropicalPlanets.find((p) => p.name === "Sun")!.tropicalLongitude;
  const progSun = sunTropicalLon(progressedInstant);
  let arc = progSun - natalSun;
  while (arc < 0) arc += 360;
  while (arc > 360) arc -= 360;
  const directed = natal.tropicalPlanets.map((p) => ({
    name: p.name,
    natal: p.tropicalLongitude,
    directed: norm360(p.tropicalLongitude + arc),
  }));
  const directedAsc = norm360(natal.tropicalAscendant + arc);
  const directedMc = norm360(natal.midheaven + arc);
  return { arc, ageYears, directed, directedAsc, directedMc };
}

// Solar Arc hits: directed point aspecting a natal point within tight orb (1° classical).
export function solarArcHits(natal: WesternChart, sa: ReturnType<typeof solarArcDirections>, orb = 1) {
  const HARD = [0, 45, 90, 135, 180]; // conjunction, semisquare, square, sesqui, opposition
  const SOFT = [60, 120];
  const targets = [
    ...natal.tropicalPlanets.map((p) => ({ name: p.name, lon: p.tropicalLongitude })),
    { name: "ASC", lon: natal.tropicalAscendant }, { name: "MC", lon: natal.midheaven },
  ];
  const hits: { a: string; b: string; type: string; kind: "hard" | "soft"; orb: number }[] = [];
  for (const d of sa.directed) {
    for (const t of targets) {
      if (d.name === t.name) continue;
      let diff = Math.abs(d.directed - t.lon); if (diff > 180) diff = 360 - diff;
      for (const ang of HARD) if (Math.abs(diff - ang) <= orb)
        hits.push({ a: d.name, b: t.name, type: aspectName(ang), kind: "hard", orb: Math.abs(diff - ang) });
      for (const ang of SOFT) if (Math.abs(diff - ang) <= orb)
        hits.push({ a: d.name, b: t.name, type: aspectName(ang), kind: "soft", orb: Math.abs(diff - ang) });
    }
  }
  return hits.sort((x, y) => x.orb - y.orb);
}

function aspectName(a: number) {
  return { 0: "conjunction", 45: "semisquare", 60: "sextile", 90: "square", 120: "trine", 135: "sesquiquadrate", 180: "opposition" }[a as 0|45|60|90|120|135|180]!;
}

// --- Harmonic charts ---
// Multiply every ecliptic longitude by N and normalise.
export function harmonicChart(natal: WesternChart, n: number) {
  const planets = natal.tropicalPlanets.map((p) => ({
    name: p.name,
    longitude: norm360(p.tropicalLongitude * n),
    retrograde: p.retrograde,
  }));
  // Harmonic aspects — conjunctions in the harmonic wheel = Nth-harmonic aspects natally.
  const hits: { a: string; b: string; orb: number }[] = [];
  for (let i = 0; i < planets.length; i++) for (let j = i + 1; j < planets.length; j++) {
    let d = Math.abs(planets[i].longitude - planets[j].longitude); if (d > 180) d = 360 - d;
    if (d <= 6) hits.push({ a: planets[i].name, b: planets[j].name, orb: d });
  }
  return { n, planets, conjunctions: hits.sort((a, b) => a.orb - b.orb) };
}

// --- Midpoints (Ebertin cosmobiology) ---
// Midpoint M(A,B) = shorter-arc midpoint of two longitudes.
export function midpoint(a: number, b: number) {
  const diff = ((b - a + 360) % 360);
  const m = a + diff / 2;
  const alt = m + 180;
  // Ebertin uses the "closer" midpoint (shorter arc form) — return both to be safe.
  return { direct: norm360(m), indirect: norm360(alt) };
}

export function midpointTree(natal: WesternChart, orb = 1.5) {
  const pts = [
    ...natal.tropicalPlanets.map((p) => ({ name: p.name, lon: p.tropicalLongitude })),
    { name: "ASC", lon: natal.tropicalAscendant }, { name: "MC", lon: natal.midheaven },
  ];
  const mids: { pair: string; lon: number }[] = [];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const { direct } = midpoint(pts[i].lon, pts[j].lon);
    mids.push({ pair: `${pts[i].name}/${pts[j].name}`, lon: direct });
  }
  // Occupied midpoints — planets sitting within orb on the 22.5° dial (8th-harmonic).
  const dial = 22.5;
  const tree: Record<string, { pair: string; lon: number; hit: string; type: number; orb: number }[]> = {};
  for (const p of pts) {
    for (const m of mids) {
      if (m.pair.split("/").includes(p.name)) continue;
      // Test hits at multiples of 22.5° on the 45° dial (Ebertin): 0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180
      let d = Math.abs(p.lon - m.lon); if (d > 180) d = 360 - d;
      const k = Math.round(d / dial);
      const target = k * dial;
      const off = Math.abs(d - target);
      if (target <= 180 && off <= orb) {
        (tree[p.name] ||= []).push({ pair: m.pair, lon: m.lon, hit: p.name, type: target, orb: off });
      }
    }
  }
  for (const k of Object.keys(tree)) tree[k].sort((a, b) => a.orb - b.orb);
  return tree;
}

// --- Lunar Return: transiting Moon returns to natal Moon longitude
export function lunarReturnDate(natalMoonLon: number, near: Date = new Date()) {
  const diff = (d: Date) => {
    const g = A.GeoVector(A.Body.Moon, d, true);
    const rot = A.Rotation_EQJ_ECT(d);
    const e = A.RotateVector(rot, g);
    let x = norm360(rad2deg(Math.atan2(e.y, e.x))) - natalMoonLon;
    while (x > 180) x -= 360; while (x < -180) x += 360;
    return x;
  };
  // Bracket within ±16 days.
  let a = near.getTime() - 16 * 86400000, b = near.getTime() + 16 * 86400000;
  let fa = diff(new Date(a)), fb = diff(new Date(b));
  if (fa * fb > 0) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (a + b) / 2; const fm = diff(new Date(mid));
    if (fa * fm <= 0) { b = mid; fb = fm; } else { a = mid; fa = fm; }
    if (Math.abs(fm) < 1e-5) break;
  }
  return new Date((a + b) / 2);
}
