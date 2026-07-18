// Cosmic Weather engine — a day's astrological "weather report":
// hourly Moon-aspect timeline, Moon void-of-course, planetary hours
// (Chaldean), and a per-sign mood forecast derived from live transits.
import { computeCurrentSky } from "./transits";
import { ASPECTS, type AspectType } from "./western";
import { RASHIS, type PlanetName } from "./vedic";

const norm360 = (x: number) => ((x % 360) + 360) % 360;

export type AspectEvent = {
  when: Date;
  transit: PlanetName;
  natal: PlanetName; // other body in sky
  type: AspectType;
  angle: number;
  tone: "harmonious" | "tense" | "neutral" | "fusion";
};

const TONE: Record<AspectType, AspectEvent["tone"]> = {
  conjunction: "fusion",
  sextile: "harmonious",
  square: "tense",
  trine: "harmonious",
  opposition: "tense",
};

const FAST: PlanetName[] = ["Moon", "Sun", "Mercury", "Venus", "Mars"];
const OTHER: PlanetName[] = ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

// Scan the day for exact aspect hits (orb crossing zero) using coarse-fine sampling.
export function dayAspectTimeline(day: Date): AspectEvent[] {
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  const step = 30 * 60 * 1000; // 30 min
  const samples: { t: number; lons: Record<string, number> }[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += step) {
    const s = computeCurrentSky(new Date(t), 0, 0);
    const lons: Record<string, number> = {};
    for (const p of s.tropicalPlanets) lons[p.name] = p.tropicalLongitude;
    samples.push({ t, lons });
  }
  const hits: AspectEvent[] = [];
  const aspects = Object.entries(ASPECTS) as [AspectType, typeof ASPECTS[AspectType]][];
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    for (const p1 of FAST) {
      for (const p2 of OTHER) {
        if (p1 === p2) continue;
        for (const [name, def] of aspects) {
          const diffA = signedDelta(a.lons[p1] - a.lons[p2], def.angle);
          const diffB = signedDelta(b.lons[p1] - b.lons[p2], def.angle);
          if (Math.sign(diffA) !== Math.sign(diffB) && Math.abs(diffA) < 6 && Math.abs(diffB) < 6) {
            // bisect
            let lo = a.t, hi = b.t;
            for (let k = 0; k < 12; k++) {
              const mid = (lo + hi) / 2;
              const s = computeCurrentSky(new Date(mid), 0, 0);
              const l1 = s.tropicalPlanets.find(x => x.name === p1)!.tropicalLongitude;
              const l2 = s.tropicalPlanets.find(x => x.name === p2)!.tropicalLongitude;
              const dm = signedDelta(l1 - l2, def.angle);
              if (Math.sign(dm) === Math.sign(diffA)) lo = mid; else hi = mid;
            }
            hits.push({
              when: new Date((lo + hi) / 2),
              transit: p1, natal: p2, type: name, angle: def.angle,
              tone: TONE[name],
            });
          }
        }
      }
    }
  }
  // Dedupe by pair+type within 20 min
  const dedup: AspectEvent[] = [];
  for (const h of hits.sort((x, y) => x.when.getTime() - y.when.getTime())) {
    const key = `${h.transit}-${h.natal}-${h.type}`;
    const revKey = `${h.natal}-${h.transit}-${h.type}`;
    const near = dedup.find(d => (`${d.transit}-${d.natal}-${d.type}` === key || `${d.transit}-${d.natal}-${d.type}` === revKey) && Math.abs(d.when.getTime() - h.when.getTime()) < 20 * 60000);
    if (!near) dedup.push(h);
  }
  return dedup;
}

function signedDelta(x: number, target: number): number {
  let d = norm360(x);
  if (d > 180) d = d - 360;
  const a = Math.abs(d) - target;
  return a;
}

// Void-of-course Moon: after Moon's last major aspect in its current sign
// until it enters the next sign.
export function moonVoidOfCourse(day: Date): { start: Date; end: Date } | null {
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 48 * 3600 * 1000);
  const step = 20 * 60 * 1000;
  let lastAspect: Date | null = null;
  let currentSignEnter: Date = start;
  let curSign = Math.floor(computeCurrentSky(start, 0, 0).tropicalPlanets.find(p => p.name === "Moon")!.tropicalLongitude / 30);
  let voidEnd: Date | null = null;

  for (let t = start.getTime() + step; t <= end.getTime(); t += step) {
    const s = computeCurrentSky(new Date(t), 0, 0);
    const moon = s.tropicalPlanets.find(p => p.name === "Moon")!;
    const sign = Math.floor(moon.tropicalLongitude / 30);
    if (sign !== curSign) {
      voidEnd = new Date(t);
      break;
    }
    for (const p of s.tropicalPlanets) {
      if (p.name === "Moon") continue;
      let d = Math.abs(norm360(moon.tropicalLongitude - p.tropicalLongitude));
      if (d > 180) d = 360 - d;
      for (const def of Object.values(ASPECTS)) {
        if (Math.abs(d - def.angle) < 0.5) {
          lastAspect = new Date(t);
        }
      }
    }
  }
  if (lastAspect && voidEnd && voidEnd.getTime() > lastAspect.getTime()) {
    return { start: lastAspect, end: voidEnd };
  }
  return null;
}

// Chaldean planetary hours: 12 daylight + 12 night hours,
// each ruled by a planet in Saturn→Jupiter→Mars→Sun→Venus→Mercury→Moon order.
const CHALDEAN: PlanetName[] = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
const DAY_RULER: PlanetName[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]; // Sun..Sat

export type PlanetaryHour = {
  index: number;
  start: Date;
  end: Date;
  ruler: PlanetName;
  isDay: boolean;
};

export function planetaryHours(day: Date, latitude: number, longitude: number): PlanetaryHour[] {
  // Approximate sunrise/sunset with simple algorithm (equinox-approx okay for most latitudes).
  const { sunrise, sunset, nextSunrise } = approxSunTimes(day, latitude, longitude);
  const dayLen = (sunset.getTime() - sunrise.getTime()) / 12;
  const nightLen = (nextSunrise.getTime() - sunset.getTime()) / 12;
  // Day-of-week for the day at sunrise (local, using UTC day since we don't have precise tz)
  const dow = new Date(sunrise).getDay(); // 0=Sun..6=Sat
  const firstRuler = DAY_RULER[dow];
  const startIdx = CHALDEAN.indexOf(firstRuler);
  const out: PlanetaryHour[] = [];
  for (let i = 0; i < 12; i++) {
    const s = new Date(sunrise.getTime() + i * dayLen);
    const e = new Date(sunrise.getTime() + (i + 1) * dayLen);
    out.push({ index: i, start: s, end: e, ruler: CHALDEAN[(startIdx + i) % 7], isDay: true });
  }
  for (let i = 0; i < 12; i++) {
    const s = new Date(sunset.getTime() + i * nightLen);
    const e = new Date(sunset.getTime() + (i + 1) * nightLen);
    out.push({ index: 12 + i, start: s, end: e, ruler: CHALDEAN[(startIdx + 12 + i) % 7], isDay: false });
  }
  return out;
}

function approxSunTimes(day: Date, latitude: number, longitude: number) {
  // Very compact sunrise/sunset (NOAA-lite).
  const rad = Math.PI / 180;
  const y = day.getFullYear();
  const start = Date.UTC(y, 0, 0);
  const doy = Math.floor((day.getTime() - start) / 86400000);
  const decl = 23.44 * Math.sin(rad * (360 / 365) * (doy - 81));
  const cosH = (Math.sin(-0.83 * rad) - Math.sin(latitude * rad) * Math.sin(decl * rad)) /
    (Math.cos(latitude * rad) * Math.cos(decl * rad));
  const clamp = Math.max(-1, Math.min(1, cosH));
  const H = Math.acos(clamp) / rad; // degrees
  const solarNoonUTC = 12 - longitude / 15;
  const sunriseUTC = solarNoonUTC - H / 15;
  const sunsetUTC = solarNoonUTC + H / 15;
  const base = Date.UTC(y, day.getMonth(), day.getDate());
  const sunrise = new Date(base + sunriseUTC * 3600000);
  const sunset = new Date(base + sunsetUTC * 3600000);
  const nextSunrise = new Date(sunrise.getTime() + 24 * 3600000);
  return { sunrise, sunset, nextSunrise };
}

// Per-sign mood — score derived from current transits' harmony to each sign midpoint.
export function signForecast(day: Date): { sign: string; score: number; tone: "great" | "good" | "mixed" | "tense" }[] {
  const s = computeCurrentSky(day, 0, 0);
  const results: { sign: string; score: number; tone: "great" | "good" | "mixed" | "tense" }[] = [];
  for (let i = 0; i < 12; i++) {
    const mid = i * 30 + 15;
    let score = 0;
    for (const p of s.tropicalPlanets) {
      let d = Math.abs(norm360(p.tropicalLongitude - mid));
      if (d > 180) d = 360 - d;
      for (const [name, def] of Object.entries(ASPECTS) as [AspectType, typeof ASPECTS[AspectType]][]) {
        const orb = Math.abs(d - def.angle);
        if (orb <= def.orb * 0.7) {
          const weight = (1 - orb / def.orb) * planetWeight(p.name);
          score += TONE[name] === "harmonious" ? weight : TONE[name] === "tense" ? -weight : weight * 0.3;
        }
      }
    }
    let tone: "great" | "good" | "mixed" | "tense" = "mixed";
    if (score > 2) tone = "great";
    else if (score > 0.4) tone = "good";
    else if (score < -1.2) tone = "tense";
    results.push({ sign: RASHIS[i], score, tone });
  }
  return results;
}

function planetWeight(p: PlanetName): number {
  switch (p) {
    case "Jupiter": case "Venus": return 1.5;
    case "Sun": case "Moon": return 1.2;
    case "Saturn": case "Mars": return 1.3;
    default: return 0.7;
  }
}
