// Astrocartography (Local Space / Relocational Astrology).
//
// For a natal moment, every planet casts four "lines" onto the world map:
//   MC  — meridian where the planet is culminating (upper meridian)
//   IC  — meridian where the planet is on the lower meridian
//   ASC — curve where the planet is rising on the eastern horizon
//   DSC — curve where the planet is setting on the western horizon
//
// Standing on / near one of these lines relocates that planet to an angle
// of the chart, dramatically amplifying its theme in your life at that place.
//
// Math (simplified, tropical, β=0 approximation which is standard for ACG):
//   RA  = atan2( sin(λ)·cos(ε), cos(λ) )
//   Dec = asin( sin(ε)·sin(λ) )
//   MC longitude λ_geo = RA − GMST°   (mod 360, wrapped to −180..180)
//   Rising/setting hour angle: cos(H) = −tan(φ)·tan(δ)
//     ASC line: geo lon = RA − H − GMST°   (H taken as +arccos, rising in east)
//     DSC line: geo lon = RA + H − GMST°   (setting in west)
//   Above |φ| where |tan(φ)·tan(δ)| > 1 the planet is circumpolar and the line
//   ends — we clip to the arctic/antarctic zone accordingly.

import * as A from "astronomy-engine";
import { computeWesternChart } from "./western";
import type { PlanetName } from "./vedic";
import type { BirthInput } from "./progressions";

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;

/** Wrap to (−180, 180]. */
function wrapLon(x: number): number {
  let v = ((x + 180) % 360 + 360) % 360 - 180;
  if (v === -180) v = 180;
  return v;
}

function meanObliquity(date: Date): number {
  const jd = 2440587.5 + date.getTime() / 86400000;
  const T = (jd - 2451545.0) / 36525;
  return 23.439291 - 0.0130042 * T - 1.64e-7 * T * T + 5.036e-7 * T * T * T;
}

function eclipticToEquatorial(lambdaDeg: number, epsDeg: number): { ra: number; dec: number } {
  const l = deg2rad(lambdaDeg);
  const e = deg2rad(epsDeg);
  const ra = norm360(rad2deg(Math.atan2(Math.sin(l) * Math.cos(e), Math.cos(l))));
  const dec = rad2deg(Math.asin(Math.sin(e) * Math.sin(l)));
  return { ra, dec };
}

export type AcgLineKind = "MC" | "IC" | "ASC" | "DSC";

export type AcgSegment = {
  planet: PlanetName;
  kind: AcgLineKind;
  /** Polyline in [lon, lat] pairs. Multiple segments split at date-line wraps. */
  points: Array<[number, number]>;
};

export type AcgPlanetData = {
  planet: PlanetName;
  ra: number;
  dec: number;
  /** Meridian longitudes (MC / IC) as a single geographic longitude each. */
  mcLon: number;
  icLon: number;
};

export type AcgResult = {
  gmstDeg: number;
  obliquity: number;
  planets: AcgPlanetData[];
  segments: AcgSegment[];
};

const BODIES: PlanetName[] = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu",
];

export const PLANET_COLORS: Record<PlanetName, string> = {
  Sun: "#F5C542",
  Moon: "#E8E6F0",
  Mercury: "#A0E1D0",
  Venus: "#F2A2C4",
  Mars: "#E86A5A",
  Jupiter: "#D6A464",
  Saturn: "#8AA8C4",
  Rahu: "#8266B0",
  Ketu: "#4E7C6A",
};

export const PLANET_THEMES: Record<PlanetName, { keyword: string; asc: string; mc: string }> = {
  Sun:    { keyword: "Vitality · authority · leadership",   asc: "You are seen — visibility, confidence, self-expression.", mc: "Recognition and public status; leadership roles surface." },
  Moon:   { keyword: "Emotion · home · nurture",            asc: "You feel deeply at home; nurturing, family and belonging.", mc: "Career touches care, food, hospitality, the public feminine." },
  Mercury:{ keyword: "Mind · commerce · communication",     asc: "Sharpened thinking, writing, learning, connections.", mc: "Public voice — media, teaching, deals, negotiation." },
  Venus:  { keyword: "Love · art · pleasure · money",       asc: "Attractiveness, romance, aesthetics, harmony.", mc: "Career in arts, beauty, luxury, diplomacy; social favor." },
  Mars:   { keyword: "Drive · action · courage · conflict", asc: "High energy, sports, ambition, but also friction.", mc: "Achievement through effort; competitive, military, surgical." },
  Jupiter:{ keyword: "Growth · fortune · wisdom",           asc: "Optimism, opportunity, expansion, teachers appear.", mc: "Career growth, publishing, law, higher learning, abundance." },
  Saturn: { keyword: "Discipline · duty · limitation",      asc: "Serious, mature, responsible — tests and slow mastery.", mc: "Long-term authority, structure, government, real estate." },
  Rahu:   { keyword: "Desire · innovation · foreign",       asc: "Magnetic ambition, obsession, unconventional identity.", mc: "Rapid rise in cutting-edge or foreign spheres; hunger for status." },
  Ketu:   { keyword: "Detachment · past life · mysticism",  asc: "Introspection, spirituality, letting go of identity.", mc: "Behind-the-scenes work, research, renunciation of ambition." },
};

/** GMST in degrees for the given UTC date. */
function gmstDegAt(date: Date): number {
  return norm360(A.SiderealTime(date) * 15);
}

/** Compute a rising-or-setting curve for a body of declination δ. */
function horizonCurve(ra: number, dec: number, gmst: number, kind: "ASC" | "DSC"): AcgSegment["points"][] {
  // At altitude 0: cos(H) = −tan(φ)·tan(δ).
  // Valid where |tan(φ)·tan(δ)| ≤ 1.
  const decR = deg2rad(dec);
  const tanDec = Math.tan(decR);

  // Find latitude bounds where circumpolar clipping kicks in.
  // tan(φ) = ±1/|tan(δ)|
  let phiMax = 89;
  if (Math.abs(tanDec) > 1e-6) {
    phiMax = Math.min(89, rad2deg(Math.atan(1 / Math.abs(tanDec))) - 0.5);
  }

  const step = 1; // 1° latitude resolution — smooth curves
  const pts: Array<[number, number]> = [];
  for (let phi = -phiMax; phi <= phiMax + 1e-9; phi += step) {
    const cosH = -Math.tan(deg2rad(phi)) * tanDec;
    if (cosH < -1 || cosH > 1) continue;
    const H = rad2deg(Math.acos(cosH)); // 0..180
    // Rising (ASC) in east → LHA = −H (planet east of meridian).
    // Setting (DSC) in west → LHA = +H.
    // Geo lon: LHA = LST − RA  ⇒  lon = RA + LHA − GMST°.
    const lon = wrapLon(ra + (kind === "ASC" ? -H : H) - gmst);
    pts.push([lon, phi]);
  }

  // Split at longitude jumps > 180° (date-line wraps).
  const segments: AcgSegment["points"][] = [];
  let cur: AcgSegment["points"] = [];
  for (let i = 0; i < pts.length; i++) {
    if (cur.length === 0) {
      cur.push(pts[i]);
      continue;
    }
    const prev = cur[cur.length - 1];
    if (Math.abs(pts[i][0] - prev[0]) > 180) {
      segments.push(cur);
      cur = [pts[i]];
    } else {
      cur.push(pts[i]);
    }
  }
  if (cur.length > 1) segments.push(cur);
  return segments;
}

export function computeAstrocartography(birth: BirthInput): AcgResult {
  const chart = computeWesternChart(birth, "placidus");
  const localMs = Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute);
  const utc = new Date(localMs - birth.tzOffsetHours * 3600000);
  const eps = meanObliquity(utc);
  const gmst = gmstDegAt(utc);

  const segments: AcgSegment[] = [];
  const planets: AcgPlanetData[] = [];

  for (const name of BODIES) {
    const p = chart.tropicalPlanets.find((pp) => pp.name === name);
    if (!p) continue;
    const { ra, dec } = eclipticToEquatorial(p.tropicalLongitude, eps);

    // MC / IC — single geographic meridians.
    const mcLon = wrapLon(ra - gmst);
    const icLon = wrapLon(mcLon + 180);
    planets.push({ planet: name, ra, dec, mcLon, icLon });

    segments.push({ planet: name, kind: "MC", points: [[mcLon, -85], [mcLon, 85]] });
    segments.push({ planet: name, kind: "IC", points: [[icLon, -85], [icLon, 85]] });

    for (const kind of ["ASC", "DSC"] as const) {
      const curves = horizonCurve(ra, dec, gmst, kind);
      for (const c of curves) {
        if (c.length > 1) segments.push({ planet: name, kind, points: c });
      }
    }
  }

  return { gmstDeg: gmst, obliquity: eps, planets, segments };
}

/** Given a hovered/clicked lat/lon, list any lines within `orbDeg`. */
export function acgInfluenceAt(
  result: AcgResult,
  lat: number,
  lon: number,
  orbDeg = 3,
): Array<{ planet: PlanetName; kind: AcgLineKind; distanceDeg: number }> {
  const hits: Array<{ planet: PlanetName; kind: AcgLineKind; distanceDeg: number }> = [];
  for (const seg of result.segments) {
    // Closest point on the polyline.
    let best = Infinity;
    for (let i = 0; i < seg.points.length - 1; i++) {
      const [x1, y1] = seg.points[i];
      const [x2, y2] = seg.points[i + 1];
      // Only consider segment if lat is in its range for horizon lines,
      // or the whole thing for meridians (which run pole to pole).
      const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
      if (lat < minY - 1 || lat > maxY + 1) continue;
      // Interpolate segment longitude at target latitude.
      const t = (lat - y1) / (y2 - y1 || 1);
      const xAt = x1 + t * (x2 - x1);
      let d = Math.abs(xAt - lon);
      if (d > 180) d = 360 - d;
      // Weight by cos(lat) so equatorial spacing feels natural.
      d *= Math.cos(deg2rad(lat));
      if (d < best) best = d;
    }
    if (best <= orbDeg) hits.push({ planet: seg.planet, kind: seg.kind, distanceDeg: best });
  }
  hits.sort((a, b) => a.distanceDeg - b.distanceDeg);
  return hits;
}

// A short list of anchor cities so the map isn't empty and users can
// quickly evaluate famous places without geocoding.
export const ACG_CITIES: Array<{ name: string; lat: number; lon: number }> = [
  { name: "New York", lat: 40.71, lon: -74.01 },
  { name: "Los Angeles", lat: 34.05, lon: -118.24 },
  { name: "London", lat: 51.51, lon: -0.13 },
  { name: "Paris", lat: 48.86, lon: 2.35 },
  { name: "Berlin", lat: 52.52, lon: 13.40 },
  { name: "Rome", lat: 41.90, lon: 12.50 },
  { name: "Dubai", lat: 25.20, lon: 55.27 },
  { name: "Mumbai", lat: 19.08, lon: 72.88 },
  { name: "Delhi", lat: 28.61, lon: 77.21 },
  { name: "Bangalore", lat: 12.97, lon: 77.59 },
  { name: "Singapore", lat: 1.35, lon: 103.82 },
  { name: "Tokyo", lat: 35.68, lon: 139.69 },
  { name: "Sydney", lat: -33.87, lon: 151.21 },
  { name: "Rio", lat: -22.91, lon: -43.17 },
  { name: "Cape Town", lat: -33.92, lon: 18.42 },
  { name: "Bali", lat: -8.65, lon: 115.22 },
];
