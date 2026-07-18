// Live Sky engine — real-time planetary snapshot, moon phase,
// retrograde stations, upcoming sign ingresses, void-of-course moon.
import { computeCurrentSky } from "./transits";
import { RASHIS, type PlanetName } from "./vedic";
import type { WesternChart } from "./western";

const norm360 = (x: number) => ((x % 360) + 360) % 360;

export type MoonPhase = {
  angle: number;               // 0..360, 0=new, 180=full
  illumination: number;        // 0..1
  name: string;                // "New Moon" | "Waxing Crescent" | ...
  nextNew: Date;
  nextFull: Date;
};

export function moonPhase(sky: WesternChart, now: Date): MoonPhase {
  const sun = sky.tropicalPlanets.find((p) => p.name === "Sun")!;
  const moon = sky.tropicalPlanets.find((p) => p.name === "Moon")!;
  const angle = norm360(moon.tropicalLongitude - sun.tropicalLongitude);
  const illumination = (1 - Math.cos((angle * Math.PI) / 180)) / 2;
  let name = "New Moon";
  if (angle < 22.5) name = "New Moon";
  else if (angle < 67.5) name = "Waxing Crescent";
  else if (angle < 112.5) name = "First Quarter";
  else if (angle < 157.5) name = "Waxing Gibbous";
  else if (angle < 202.5) name = "Full Moon";
  else if (angle < 247.5) name = "Waning Gibbous";
  else if (angle < 292.5) name = "Last Quarter";
  else if (angle < 337.5) name = "Waning Crescent";
  else name = "New Moon";
  return {
    angle,
    illumination,
    name,
    nextNew: findMoonAngle(now, 0),
    nextFull: findMoonAngle(now, 180),
  };
}

// Find next moment where (Moon - Sun) mod 360 == target.
function findMoonAngle(from: Date, target: number): Date {
  let t = from.getTime();
  for (let i = 0; i < 60; i++) {
    const d = new Date(t);
    const sky = computeCurrentSky(d, 0, 0);
    const sun = sky.tropicalPlanets.find((p) => p.name === "Sun")!;
    const moon = sky.tropicalPlanets.find((p) => p.name === "Moon")!;
    const a = norm360(moon.tropicalLongitude - sun.tropicalLongitude);
    let delta = norm360(target - a);
    if (delta > 180) delta -= 360;
    // Moon gains ~12°/day on Sun
    const hours = delta / 12 * 24;
    t += hours * 3600 * 1000;
    if (Math.abs(delta) < 0.05) break;
  }
  return new Date(t);
}

export type RetroInfo = {
  planet: PlanetName;
  retrograde: boolean;
  nextStation: Date | null;   // when it flips
  nextStationKind: "direct" | "retrograde" | null;
};

const RETRO_CANDIDATES: PlanetName[] = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

export function retrogradeStatus(now: Date): RetroInfo[] {
  const skyNow = computeCurrentSky(now, 0, 0);
  return RETRO_CANDIDATES.map((name) => {
    const p = skyNow.tropicalPlanets.find((q) => q.name === name)!;
    const retro = p.retrograde;
    // Scan forward up to 400 days for flip
    let next: Date | null = null;
    let kind: "direct" | "retrograde" | null = null;
    const stepDays = 3;
    let prev = retro;
    let prevT = now.getTime();
    for (let i = 1; i < 140; i++) {
      const t = now.getTime() + i * stepDays * 86400000;
      const s = computeCurrentSky(new Date(t), 0, 0);
      const cur = s.tropicalPlanets.find((q) => q.name === name)!.retrograde;
      if (cur !== prev) {
        // bisect
        let lo = prevT, hi = t;
        for (let b = 0; b < 20; b++) {
          const mid = (lo + hi) / 2;
          const sm = computeCurrentSky(new Date(mid), 0, 0);
          const rm = sm.tropicalPlanets.find((q) => q.name === name)!.retrograde;
          if (rm === prev) lo = mid; else hi = mid;
        }
        next = new Date(hi);
        kind = cur ? "retrograde" : "direct";
        break;
      }
      prev = cur;
      prevT = t;
    }
    return { planet: name, retrograde: retro, nextStation: next, nextStationKind: kind };
  });
}

export type Ingress = {
  planet: PlanetName;
  fromSign: number;
  toSign: number;
  when: Date;
};

const INGRESS_PLANETS: PlanetName[] = ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

export function upcomingIngresses(now: Date, days = 90): Ingress[] {
  const out: Ingress[] = [];
  for (const name of INGRESS_PLANETS) {
    const skyNow = computeCurrentSky(now, 0, 0);
    const p = skyNow.tropicalPlanets.find((q) => q.name === name)!;
    const curSign = Math.floor(p.tropicalLongitude / 30);
    const stepH = name === "Sun" || name === "Mercury" || name === "Venus" ? 12 : 48;
    let prevSign = curSign;
    let prevT = now.getTime();
    let prevLon = p.tropicalLongitude;
    const end = now.getTime() + days * 86400000;
    for (let t = prevT + stepH * 3600000; t <= end; t += stepH * 3600000) {
      const s = computeCurrentSky(new Date(t), 0, 0);
      const lp = s.tropicalPlanets.find((q) => q.name === name)!;
      const sign = Math.floor(lp.tropicalLongitude / 30);
      if (sign !== prevSign) {
        // bisect
        let lo = prevT, hi = t;
        for (let b = 0; b < 18; b++) {
          const mid = (lo + hi) / 2;
          const sm = computeCurrentSky(new Date(mid), 0, 0);
          const sg = Math.floor(sm.tropicalPlanets.find((q) => q.name === name)!.tropicalLongitude / 30);
          if (sg === prevSign) lo = mid; else hi = mid;
        }
        out.push({ planet: name, fromSign: prevSign, toSign: sign, when: new Date(hi) });
        break; // only next ingress per planet
      }
      prevSign = sign;
      prevT = t;
      prevLon = lp.tropicalLongitude;
      void prevLon;
    }
  }
  return out.sort((a, b) => a.when.getTime() - b.when.getTime());
}

export function signName(idx: number): string {
  return RASHIS[((idx % 12) + 12) % 12];
}

export function liveSkySnapshot(now = new Date()) {
  const sky = computeCurrentSky(now, 0, 0);
  return {
    now,
    sky,
    moon: moonPhase(sky, now),
    retros: retrogradeStatus(now),
    ingresses: upcomingIngresses(now, 90),
  };
}
