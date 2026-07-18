// Astrocartography — Deep additions:
//   • Parans: latitudes where two planet lines cross (Jim Lewis "crossings").
//   • Local Space: azimuth-radiated great-circle lines from any centre city.
//   • City Recommender: rank ACG cities against an intention profile.
//
// Depends on the base engine in ./astrocartography.

import type { AcgResult, AcgLineKind, AcgSegment } from "./astrocartography";
import { acgInfluenceAt } from "./astrocartography";
import type { PlanetName } from "./vedic";
import { computeWesternChart } from "./western";
import type { BirthInput } from "./progressions";

const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;
const norm360 = (x: number) => ((x % 360) + 360) % 360;

// ─────────────────────────── Parans ───────────────────────────

export type Paran = {
  a: { planet: PlanetName; kind: AcgLineKind };
  b: { planet: PlanetName; kind: AcgLineKind };
  lat: number;
  lon: number;
  /** Approximate strength (0..1) — closer to equator scores slightly higher. */
  strength: number;
};

/** Intersect two ACG line segments (in [lon,lat]) latitude-by-latitude. */
function intersectSegments(sa: AcgSegment, sb: AcgSegment): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const ptsA = sa.points, ptsB = sb.points;
  // Sample every 0.5° latitude.
  for (let lat = -80; lat <= 80; lat += 0.5) {
    const la = lonAt(ptsA, lat), lb = lonAt(ptsB, lat);
    if (la == null || lb == null) continue;
    let d = Math.abs(la - lb);
    if (d > 180) d = 360 - d;
    if (d < 0.6) out.push([(la + lb) / 2, lat]);
  }
  // Deduplicate close hits.
  const clean: Array<[number, number]> = [];
  for (const p of out) {
    if (!clean.some((q) => Math.abs(q[1] - p[1]) < 2 && Math.abs(q[0] - p[0]) < 4)) {
      clean.push(p);
    }
  }
  return clean;
}
function lonAt(pts: Array<[number, number]>, lat: number): number | null {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
    if (lat < minY || lat > maxY) continue;
    const t = (lat - y1) / (y2 - y1 || 1);
    return x1 + t * (x2 - x1);
  }
  return null;
}

export function computeParans(result: AcgResult, maxPerPair = 2): Paran[] {
  const segs = result.segments;
  const out: Paran[] = [];
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const a = segs[i], b = segs[j];
      if (a.planet === b.planet) continue;
      const hits = intersectSegments(a, b).slice(0, maxPerPair);
      for (const [lon, lat] of hits) {
        out.push({
          a: { planet: a.planet, kind: a.kind },
          b: { planet: b.planet, kind: b.kind },
          lat, lon,
          strength: Math.max(0, 1 - Math.abs(lat) / 90),
        });
      }
    }
  }
  // Rank by strength then equatorial-ness.
  out.sort((x, y) => y.strength - x.strength);
  return out.slice(0, 60);
}

// ─────────────────────── Local Space ───────────────────────

export type LocalSpaceLine = {
  planet: PlanetName;
  azimuthDeg: number; // 0 = N, 90 = E, 180 = S, 270 = W
  /** Great-circle polyline from centre outward, [lon,lat]. */
  points: Array<[number, number]>;
};

/**
 * Local-space azimuth of each natal planet from the given centre.
 * Uses natal RA/Dec + centre's LST at BIRTH moment (classic Local Space).
 */
export function computeLocalSpace(
  birth: BirthInput,
  centre: { lat: number; lon: number },
): LocalSpaceLine[] {
  // Reuse RA/Dec already computed for ACG.
  const localMs = Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute);
  const utc = new Date(localMs - birth.tzOffsetHours * 3600000);
  const chart = computeWesternChart(birth, "placidus");
  const jd = 2440587.5 + utc.getTime() / 86400000;
  const T = (jd - 2451545.0) / 36525;
  const eps = 23.439291 - 0.0130042 * T;
  // GMST (approx, degrees):
  const gmst = norm360(
    280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T,
  );
  const lst = norm360(gmst + centre.lon);
  const phi = deg2rad(centre.lat);

  const out: LocalSpaceLine[] = [];
  for (const p of chart.tropicalPlanets) {
    const l = deg2rad(p.tropicalLongitude);
    const e = deg2rad(eps);
    const ra = rad2deg(Math.atan2(Math.sin(l) * Math.cos(e), Math.cos(l)));
    const dec = rad2deg(Math.asin(Math.sin(e) * Math.sin(l)));
    const H = deg2rad(norm360(lst - ra));
    const d = deg2rad(dec);
    // Azimuth from N, measured clockwise via E.
    const sinA = -Math.sin(H) * Math.cos(d);
    const cosA = Math.sin(d) * Math.cos(phi) - Math.cos(d) * Math.sin(phi) * Math.cos(H);
    let az = norm360(rad2deg(Math.atan2(sinA, cosA)));
    // Trace a great-circle from centre along az for up to 160°.
    const pts: Array<[number, number]> = [];
    const azR = deg2rad(az);
    const lat0 = deg2rad(centre.lat);
    const lon0 = deg2rad(centre.lon);
    for (let s = 0; s <= 160; s += 4) {
      const sR = deg2rad(s);
      const lat = Math.asin(
        Math.sin(lat0) * Math.cos(sR) + Math.cos(lat0) * Math.sin(sR) * Math.cos(azR),
      );
      const lon =
        lon0 +
        Math.atan2(
          Math.sin(azR) * Math.sin(sR) * Math.cos(lat0),
          Math.cos(sR) - Math.sin(lat0) * Math.sin(lat),
        );
      let lonD = rad2deg(lon);
      lonD = ((lonD + 540) % 360) - 180;
      pts.push([lonD, rad2deg(lat)]);
    }
    out.push({ planet: p.name as PlanetName, azimuthDeg: az, points: pts });
  }
  return out;
}

// ────────────────────── City Recommender ──────────────────────

export type Intention = "love" | "career" | "wealth" | "spirituality" | "adventure" | "healing";

export const INTENTION_LABEL: Record<Intention, string> = {
  love: "Love & romance",
  career: "Career & recognition",
  wealth: "Wealth & abundance",
  spirituality: "Spirituality & retreat",
  adventure: "Adventure & bold moves",
  healing: "Healing & restoration",
};

type Weight = Partial<Record<PlanetName, Partial<Record<AcgLineKind, number>>>>;

const INTENTION_WEIGHTS: Record<Intention, Weight> = {
  love: {
    Venus: { ASC: 1.0, MC: 0.8, DSC: 0.9, IC: 0.5 },
    Moon:  { ASC: 0.6, IC: 0.7, DSC: 0.6 },
    Jupiter: { ASC: 0.4, DSC: 0.5 },
    Saturn: { ASC: -0.4, DSC: -0.5 },
    Mars: { ASC: -0.2 },
  },
  career: {
    Sun: { MC: 1.0, ASC: 0.6 },
    Jupiter: { MC: 0.9, ASC: 0.6 },
    Saturn: { MC: 0.7, ASC: 0.3 },
    Mercury: { MC: 0.5 },
    Ketu: { MC: -0.3 },
  },
  wealth: {
    Jupiter: { MC: 0.9, ASC: 0.7, IC: 0.6 },
    Venus: { MC: 0.7, IC: 0.5 },
    Sun: { MC: 0.4 },
    Ketu: { MC: -0.4 },
    Saturn: { IC: -0.3 },
  },
  spirituality: {
    Ketu: { ASC: 0.9, IC: 0.8 },
    Jupiter: { ASC: 0.6, IC: 0.5 },
    Moon: { IC: 0.7 },
    Saturn: { IC: 0.5 },
    Rahu: { ASC: -0.3 },
  },
  adventure: {
    Mars: { ASC: 0.9, MC: 0.7 },
    Jupiter: { ASC: 0.7, MC: 0.6 },
    Rahu: { ASC: 0.6, MC: 0.5 },
    Saturn: { ASC: -0.4 },
  },
  healing: {
    Moon: { ASC: 0.9, IC: 0.9 },
    Venus: { ASC: 0.6, IC: 0.6 },
    Jupiter: { ASC: 0.5, IC: 0.5 },
    Mars: { ASC: -0.4 },
    Saturn: { ASC: -0.3 },
  },
};

export type CityScore = {
  name: string; lat: number; lon: number;
  score: number;
  positives: Array<{ planet: PlanetName; kind: AcgLineKind; orb: number }>;
  cautions: Array<{ planet: PlanetName; kind: AcgLineKind; orb: number }>;
};

export function recommendCities(
  result: AcgResult,
  cities: Array<{ name: string; lat: number; lon: number }>,
  intent: Intention,
  orbDeg = 4,
): CityScore[] {
  const w = INTENTION_WEIGHTS[intent];
  const out: CityScore[] = cities.map((c) => {
    const hits = acgInfluenceAt(result, c.lat, c.lon, orbDeg);
    let score = 0;
    const positives: CityScore["positives"] = [];
    const cautions: CityScore["cautions"] = [];
    for (const h of hits) {
      const weight = w[h.planet]?.[h.kind] ?? 0;
      if (weight === 0) continue;
      const closeness = 1 - h.distanceDeg / orbDeg; // 0..1
      const contrib = weight * closeness;
      score += contrib;
      const entry = { planet: h.planet, kind: h.kind, orb: h.distanceDeg };
      if (weight > 0) positives.push(entry);
      else cautions.push(entry);
    }
    return { ...c, score, positives, cautions };
  });
  out.sort((a, b) => b.score - a.score);
  return out;
}
