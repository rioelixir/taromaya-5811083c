// Transit timeline: retrograde stations, sign ingresses, eclipses, and
// exact-hit dates of transiting-to-natal aspects across a date window.
//
// Uses astronomy-engine for planet positions plus its built-in eclipse
// search. Everything runs client-side; no server round-trips.

import * as A from "astronomy-engine";
import { ASPECTS, type AspectType } from "./western";
import { SIGN_NAMES } from "./western";
import type { PlanetName } from "./vedic";

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const rad2deg = (r: number) => (r * 180) / Math.PI;

const AE_BODY: Record<Exclude<PlanetName, "Rahu" | "Ketu">, A.Body> = {
  Sun: A.Body.Sun, Moon: A.Body.Moon, Mars: A.Body.Mars,
  Mercury: A.Body.Mercury, Jupiter: A.Body.Jupiter,
  Venus: A.Body.Venus, Saturn: A.Body.Saturn,
};

function tropicalLon(body: A.Body, date: Date): number {
  const g = A.GeoVector(body, date, true);
  const rot = A.Rotation_EQJ_ECT(date);
  const e = A.RotateVector(rot, g);
  return norm360(rad2deg(Math.atan2(e.y, e.x)));
}

// Signed ecliptic-longitude speed (deg/day) at `date`.
function speed(body: A.Body, date: Date): number {
  const dt = 6 * 3600 * 1000; // ±6h
  const a = tropicalLon(body, new Date(date.getTime() - dt));
  const b = tropicalLon(body, new Date(date.getTime() + dt));
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d / (2 * (dt / 86400000));
}

export type Station = {
  planet: PlanetName;
  date: Date;
  kind: "retrograde" | "direct";
  longitude: number;
  sign: string;
};

export type Ingress = {
  planet: PlanetName;
  date: Date;
  fromSign: string;
  toSign: string;
  longitude: number;
};

export type EclipseEvent = {
  date: Date;
  kind: "solar" | "lunar";
  variety: string;
  obscuration?: number;
};

export type TimelineHit = {
  transit: PlanetName;
  natal: PlanetName;
  type: AspectType;
  angle: number;
  date: Date;
};

const TRANSIT_BODIES: PlanetName[] = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
];

/** Retrograde and direct stations in [start, end]. Daily-sampled sign flips. */
export function findStations(start: Date, end: Date): Station[] {
  const out: Station[] = [];
  const stepMs = 86400000; // 1 day
  for (const name of TRANSIT_BODIES) {
    if (name === "Sun" || name === "Moon") continue; // don't retrograde
    const body = AE_BODY[name as Exclude<PlanetName, "Rahu" | "Ketu">];
    let prevS = speed(body, start);
    for (let t = start.getTime() + stepMs; t <= end.getTime(); t += stepMs) {
      const d = new Date(t);
      const s = speed(body, d);
      if ((prevS >= 0 && s < 0) || (prevS < 0 && s >= 0)) {
        // Bisect for exact zero-crossing.
        let lo = t - stepMs, hi = t;
        for (let i = 0; i < 30; i++) {
          const mid = (lo + hi) / 2;
          const sm = speed(body, new Date(mid));
          if ((prevS >= 0 && sm >= 0) || (prevS < 0 && sm < 0)) lo = mid;
          else hi = mid;
        }
        const when = new Date((lo + hi) / 2);
        const lon = tropicalLon(body, when);
        out.push({
          planet: name, date: when,
          kind: prevS >= 0 ? "retrograde" : "direct",
          longitude: lon,
          sign: SIGN_NAMES[Math.floor(lon / 30)],
        });
      }
      prevS = s;
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Tropical sign ingresses in [start, end]. */
export function findIngresses(start: Date, end: Date): Ingress[] {
  const out: Ingress[] = [];
  // Rougher stepping for slow planets works fine; use 12h.
  const stepMs = 12 * 3600 * 1000;
  for (const name of TRANSIT_BODIES) {
    const body = AE_BODY[name as Exclude<PlanetName, "Rahu" | "Ketu">];
    let prevLon = tropicalLon(body, start);
    let prevSign = Math.floor(prevLon / 30);
    for (let t = start.getTime() + stepMs; t <= end.getTime(); t += stepMs) {
      const d = new Date(t);
      const lon = tropicalLon(body, d);
      const sign = Math.floor(lon / 30);
      if (sign !== prevSign) {
        // Bisect on the exact 30°-boundary crossing.
        let lo = t - stepMs, hi = t;
        const boundary = ((prevSign + (((sign - prevSign + 12) % 12) === 11 ? -1 : 1)) + 12) % 12;
        // We don't strictly need boundary; just find where floor(lon/30) flips.
        for (let i = 0; i < 30; i++) {
          const mid = (lo + hi) / 2;
          const lm = tropicalLon(body, new Date(mid));
          const sm = Math.floor(lm / 30);
          if (sm === prevSign) lo = mid; else hi = mid;
        }
        const when = new Date((lo + hi) / 2);
        const lonAt = tropicalLon(body, when);
        out.push({
          planet: name, date: when,
          fromSign: SIGN_NAMES[prevSign],
          toSign: SIGN_NAMES[Math.floor(norm360(lonAt + 0.01) / 30)],
          longitude: lonAt,
        });
        prevSign = sign;
        void boundary; // silence unused
      }
      prevLon = lon;
    }
    void prevLon;
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Solar + lunar eclipses in [start, end]. */
export function findEclipses(start: Date, end: Date): EclipseEvent[] {
  const out: EclipseEvent[] = [];
  const endMs = end.getTime();

  // Lunar
  let lun = A.SearchLunarEclipse(start);
  while (lun && lun.peak.date.getTime() <= endMs) {
    out.push({
      date: lun.peak.date,
      kind: "lunar",
      variety: lun.kind,
      obscuration: lun.obscuration,
    });
    lun = A.NextLunarEclipse(lun.peak);
  }
  // Solar (global)
  let sol = A.SearchGlobalSolarEclipse(start);
  while (sol && sol.peak.date.getTime() <= endMs) {
    out.push({
      date: sol.peak.date,
      kind: "solar",
      variety: sol.kind,
      obscuration: sol.obscuration ?? undefined,
    });
    sol = A.NextGlobalSolarEclipse(sol.peak);
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Exact-hit dates when a transiting planet aspects a natal planet's tropical
 * longitude in [start, end]. Restrict to slow bodies + Mars for a compact
 * timeline (Sun/Moon aspects happen constantly).
 */
export function findAspectHits(
  natal: { name: PlanetName; longitude: number }[],
  start: Date, end: Date,
  bodies: PlanetName[] = ["Mars", "Jupiter", "Saturn"],
  aspects: AspectType[] = ["conjunction", "opposition", "square", "trine", "sextile"],
): TimelineHit[] {
  const out: TimelineHit[] = [];
  const stepMs = 24 * 3600 * 1000;
  for (const bname of bodies) {
    if (bname === "Rahu" || bname === "Ketu") continue;
    const body = AE_BODY[bname as Exclude<PlanetName, "Rahu" | "Ketu">];
    for (const n of natal) {
      for (const aname of aspects) {
        const target = ASPECTS[aname].angle;
        const diffAt = (t: number) => {
          const lon = tropicalLon(body, new Date(t));
          let d = ((lon - n.longitude) % 360 + 360) % 360;
          if (d > 180) d = 360 - d;
          return d - target;
        };
        let prev = diffAt(start.getTime());
        for (let t = start.getTime() + stepMs; t <= end.getTime(); t += stepMs) {
          const cur = diffAt(t);
          if (prev === 0 || (prev < 0 !== cur < 0)) {
            let lo = t - stepMs, hi = t;
            for (let i = 0; i < 30; i++) {
              const mid = (lo + hi) / 2;
              const dm = diffAt(mid);
              if ((dm < 0) === (prev < 0)) lo = mid; else hi = mid;
            }
            const when = new Date((lo + hi) / 2);
            out.push({
              transit: bname, natal: n.name, type: aname,
              angle: target, date: when,
            });
          }
          prev = cur;
        }
      }
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function fmtDay(d: Date): string {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}
