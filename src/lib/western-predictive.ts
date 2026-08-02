// Predictive Western engines: planetary returns, secondary progressions,
// progressed lunar events, solar-arc directions, composite charts,
// moon-phase calendars and eclipse tables.
//
// All timings are searched numerically against astronomy-engine, so dates are
// real ephemeris events rather than approximations from mean motion.

import * as A from "astronomy-engine";
import { computeWesternChart, houseOfLongitude, SIGN_NAMES, type WesternChart } from "./western";
import { AE_BODY, dms, tropicalLongitude } from "./western-tables";

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const TROPICAL_YEAR = 365.242190;

export type BirthInput = Parameters<typeof computeWesternChart>[0];

/** Build a chart for an exact UTC instant at a given place. */
export function chartAtInstant(utc: Date, latitude: number, longitude: number): WesternChart {
  return computeWesternChart({
    year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate(),
    hour: utc.getUTCHours(), minute: utc.getUTCMinutes(),
    tzOffsetHours: 0, latitude, longitude,
  } as BirthInput);
}

function signedDiff(a: number, b: number) {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

/** Refine the instant at which a body's tropical longitude equals target. */
function refineCrossing(body: A.Body, target: number, from: Date, stepDays: number, spanDays: number): Date | null {
  let prev = signedDiff(tropicalLongitude(body, from), target);
  for (let t = stepDays; t <= spanDays; t += stepDays) {
    const d = new Date(from.getTime() + t * 86400000);
    const cur = signedDiff(tropicalLongitude(body, d), target);
    if (prev <= 0 && cur >= 0 && Math.abs(cur - prev) < 180) {
      // bisect
      let lo = new Date(d.getTime() - stepDays * 86400000), hi = d;
      for (let k = 0; k < 40; k++) {
        const mid = new Date((lo.getTime() + hi.getTime()) / 2);
        if (signedDiff(tropicalLongitude(body, mid), target) < 0) lo = mid; else hi = mid;
      }
      return hi;
    }
    prev = cur;
  }
  return null;
}

// ── Planetary returns ───────────────────────────────────────────────────────
export type PlanetReturn = { planet: string; date: Date; period: string };

const RETURN_PERIOD: Record<string, number> = {
  Moon: 27.32, Sun: 365.24, Mercury: 365.24, Venus: 365.24,
  Mars: 686.98, Jupiter: 4332.6, Saturn: 10759.2,
};

export function upcomingReturns(chart: WesternChart, from: Date = new Date()): PlanetReturn[] {
  const out: PlanetReturn[] = [];
  for (const p of chart.tropicalPlanets) {
    const body = AE_BODY[p.name];
    if (!body || !RETURN_PERIOD[p.name]) continue;
    const span = Math.min(RETURN_PERIOD[p.name] * 1.4, 12000);
    const step = p.name === "Moon" ? 0.25 : p.name === "Saturn" || p.name === "Jupiter" ? 2 : 1;
    const hit = refineCrossing(body, norm360(p.tropicalLongitude), from, step, span);
    if (hit) out.push({
      planet: p.name, date: hit,
      period: `${Math.round(RETURN_PERIOD[p.name])} day cycle`,
    });
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Full chart cast for the exact moment of a return. */
export function returnChart(when: Date, latitude: number, longitude: number): WesternChart {
  return chartAtInstant(when, latitude, longitude);
}

// ── Secondary progressions (a day for a year) ───────────────────────────────
export type ProgressedChart = {
  progressedDate: Date;
  age: number;
  planets: { name: string; longitude: number; sign: string; dmsText: string; house: number; speed: number }[];
  cusps: number[];
  ascendant: number;
  midheaven: number;
  aspects: { a: string; b: string; type: string; orb: number }[];
};

const PROG_ASPECTS: [string, number, number][] = [
  ["conjunction", 0, 1], ["sextile", 60, 1], ["square", 90, 1],
  ["trine", 120, 1], ["opposition", 180, 1],
];

export function secondaryProgressions(
  chart: WesternChart, latitude: number, longitude: number, target: Date = new Date(),
): ProgressedChart {
  const birth = new Date(chart.epochUtc);
  const years = (target.getTime() - birth.getTime()) / (TROPICAL_YEAR * 86400000);
  const progUtc = new Date(birth.getTime() + years * 86400000);
  const pc = chartAtInstant(progUtc, latitude, longitude);
  // Naibod-rate progressed MC keeps the angles moving with the Sun's mean motion.
  const mcAdvance = years * 0.9856473;
  const progMc = norm360(chart.midheaven + mcAdvance);
  const progAsc = norm360(pc.tropicalAscendant);
  const planets = pc.tropicalPlanets.map((p) => {
    const L = norm360(p.tropicalLongitude);
    const s = Math.floor(L / 30);
    const body = AE_BODY[p.name];
    return {
      name: p.name, longitude: L, sign: SIGN_NAMES[s], dmsText: dms(L - s * 30).text,
      house: houseOfLongitude(L, pc.cusps) + 1,
      speed: body ? 0 : 0,
    };
  });
  // Progressed-to-natal aspects.
  const aspects: ProgressedChart["aspects"] = [];
  for (const pp of planets) {
    for (const np of chart.tropicalPlanets) {
      const sep = Math.abs(signedDiff(pp.longitude, norm360(np.tropicalLongitude)));
      for (const [type, angle, orb] of PROG_ASPECTS) {
        if (Math.abs(sep - angle) <= orb) {
          aspects.push({ a: `progressed ${pp.name}`, b: `natal ${np.name}`, type, orb: Math.abs(sep - angle) });
        }
      }
    }
  }
  return {
    progressedDate: progUtc,
    age: Math.floor(years),
    planets, cusps: pc.cusps, ascendant: progAsc, midheaven: progMc,
    aspects: aspects.sort((a, b) => a.orb - b.orb),
  };
}

/** Progressed lunar milestones: progressed Moon sign changes and progressed lunation phases. */
export type ProgressedLunarEvent = { date: Date; label: string; detail: string };

export function progressedLunarEvents(
  chart: WesternChart, fromAge = 0, toAge = 90,
): ProgressedLunarEvent[] {
  const birth = new Date(chart.epochUtc);
  const out: ProgressedLunarEvent[] = [];
  const progAt = (age: number) => new Date(birth.getTime() + age * 86400000);
  let prevSign = -1, prevPhase = -1;
  for (let age = fromAge; age <= toAge; age += 1 / 24) {
    const d = progAt(age);
    const moon = tropicalLongitude(A.Body.Moon, d);
    const sun = tropicalLongitude(A.Body.Sun, d);
    const sign = Math.floor(moon / 30);
    const phaseAngle = norm360(moon - sun);
    const phaseIdx = Math.floor(phaseAngle / 45);
    const realDate = new Date(birth.getTime() + age * TROPICAL_YEAR * 86400000);
    if (prevSign !== -1 && sign !== prevSign) {
      out.push({
        date: realDate,
        label: `Progressed Moon enters ${SIGN_NAMES[sign]}`,
        detail: `Roughly two and a half years in which emotional focus takes on ${SIGN_NAMES[sign]} priorities.`,
      });
    }
    if (prevPhase !== -1 && phaseIdx !== prevPhase) {
      const names = ["Progressed New Moon","Progressed Crescent","Progressed First Quarter","Progressed Gibbous","Progressed Full Moon","Progressed Disseminating","Progressed Last Quarter","Progressed Balsamic"];
      out.push({
        date: realDate, label: names[phaseIdx],
        detail: phaseIdx === 0 ? "A thirty-year cycle begins: new direction seeded, often before it is visible."
          : phaseIdx === 4 ? "Mid-cycle culmination: what was started fifteen years ago becomes public and undeniable."
          : "A turning point inside the thirty-year progressed lunation cycle.",
      });
    }
    prevSign = sign; prevPhase = phaseIdx;
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ── Composite chart (midpoint method) ───────────────────────────────────────
export type CompositeChart = {
  planets: { name: string; longitude: number; sign: string; dmsText: string; house: number }[];
  cusps: number[];
  ascendant: number;
  midheaven: number;
  aspects: { a: string; b: string; type: string; orb: number }[];
};

function midLon(a: number, b: number) {
  let m = norm360((a + b) / 2);
  if (Math.abs(signedDiff(a, b)) > 90 && Math.abs(a - b) > 180) m = norm360(m + 180);
  return m;
}

export function compositeChart(c1: WesternChart, c2: WesternChart): CompositeChart {
  const asc = midLon(c1.tropicalAscendant, c2.tropicalAscendant);
  const mc = midLon(c1.midheaven, c2.midheaven);
  const cusps = Array.from({ length: 12 }, (_, i) => midLon(c1.cusps[i], c2.cusps[i]));
  const planets = c1.tropicalPlanets.map((p) => {
    const other = c2.tropicalPlanets.find((q) => q.name === p.name)!;
    const L = midLon(p.tropicalLongitude, other.tropicalLongitude);
    const s = Math.floor(L / 30);
    return { name: p.name, longitude: L, sign: SIGN_NAMES[s], dmsText: dms(L - s * 30).text, house: houseOfLongitude(L, cusps) + 1 };
  });
  const aspects: CompositeChart["aspects"] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const sep = Math.abs(signedDiff(planets[i].longitude, planets[j].longitude));
      for (const [type, angle, orb] of [["conjunction",0,8],["sextile",60,4],["square",90,6],["trine",120,6],["opposition",180,8]] as [string,number,number][]) {
        if (Math.abs(sep - angle) <= orb) aspects.push({ a: planets[i].name, b: planets[j].name, type, orb: Math.abs(sep - angle) });
      }
    }
  }
  return { planets, cusps, ascendant: asc, midheaven: mc, aspects: aspects.sort((a, b) => a.orb - b.orb) };
}

// ── Moon phase calendar ─────────────────────────────────────────────────────
export type MoonDay = { date: Date; illumination: number; age: number; phaseName: string; phaseAngle: number };
export type PhaseChange = { date: Date; name: string };

const PHASE_NAMES: [number, string][] = [
  [22.5, "New Moon"], [67.5, "Waxing Crescent"], [112.5, "First Quarter"], [157.5, "Waxing Gibbous"],
  [202.5, "Full Moon"], [247.5, "Waning Gibbous"], [292.5, "Last Quarter"], [337.5, "Waning Crescent"],
];

export function moonPhaseCalendar(start: Date, days: number): { days: MoonDay[]; changes: PhaseChange[] } {
  const out: MoonDay[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12);
    const angle = A.MoonPhase(d);
    const illum = A.Illumination(A.Body.Moon, d).phase_fraction;
    let name = "New Moon";
    for (const [limit, n] of PHASE_NAMES) { if (angle < limit) { name = n; break; } }
    if (angle >= 337.5) name = "New Moon";
    const lastNew = A.SearchMoonPhase(0, new Date(d.getTime() - 30 * 86400000), 32);
    const age = lastNew ? (d.getTime() - lastNew.date.getTime()) / 86400000 : 0;
    out.push({ date: d, illumination: illum, age, phaseName: name, phaseAngle: angle });
  }
  const changes: PhaseChange[] = [];
  for (const [target, name] of [[0, "New Moon"], [90, "First Quarter"], [180, "Full Moon"], [270, "Last Quarter"]] as const) {
    let t = A.SearchMoonPhase(target, start, days + 2);
    while (t && t.date.getTime() < start.getTime() + days * 86400000) {
      changes.push({ date: t.date, name });
      t = A.SearchMoonPhase(target, new Date(t.date.getTime() + 2 * 86400000), 40);
    }
  }
  return { days: out, changes: changes.sort((a, b) => a.date.getTime() - b.date.getTime()) };
}

// ── Eclipses ────────────────────────────────────────────────────────────────
export type EclipseRow = { date: Date; kind: "Solar" | "Lunar"; variety: string; longitude: number; sign: string; house?: number };

export function eclipseTable(from: Date, count = 8, chart?: WesternChart): EclipseRow[] {
  const rows: EclipseRow[] = [];
  try {
    let sol = A.SearchGlobalSolarEclipse(from);
    for (let i = 0; i < count; i++) {
      const L = tropicalLongitude(A.Body.Sun, sol.peak.date);
      rows.push({
        date: sol.peak.date, kind: "Solar", variety: sol.kind,
        longitude: L, sign: SIGN_NAMES[Math.floor(L / 30)],
        house: chart ? houseOfLongitude(L, chart.cusps) + 1 : undefined,
      });
      sol = A.NextGlobalSolarEclipse(sol.peak);
    }
  } catch { /* ephemeris range */ }
  try {
    let lun = A.SearchLunarEclipse(from);
    for (let i = 0; i < count; i++) {
      const L = tropicalLongitude(A.Body.Moon, lun.peak.date);
      rows.push({
        date: lun.peak.date, kind: "Lunar", variety: lun.kind,
        longitude: L, sign: SIGN_NAMES[Math.floor(L / 30)],
        house: chart ? houseOfLongitude(L, chart.cusps) + 1 : undefined,
      });
      lun = A.NextLunarEclipse(lun.peak);
    }
  } catch { /* ephemeris range */ }
  return rows.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Prenatal eclipse: the last solar or lunar eclipse before birth. */
export function prenatalEclipse(birth: Date): EclipseRow | null {
  const rows = eclipseTable(new Date(birth.getTime() - 400 * 86400000), 30)
    .filter((r) => r.date.getTime() <= birth.getTime());
  return rows.length ? rows[rows.length - 1] : null;
}

/** Prenatal epoch (Trutine of Hermes): the conception-window instant used for rectification. */
export function prenatalEpoch(chart: WesternChart, latitude: number, longitude: number) {
  const birth = new Date(chart.epochUtc);
  const approx = new Date(birth.getTime() - 273 * 86400000);
  const natalMoon = norm360(chart.tropicalPlanets.find((p) => p.name === "Moon")!.tropicalLongitude);
  // Hermes rule: at the epoch the Moon holds the natal Ascendant/Descendant degree.
  const target = natalMoon;
  const hit = refineCrossing(A.Body.Moon, target, new Date(approx.getTime() - 14 * 86400000), 0.05, 28) ?? approx;
  const epochChart = chartAtInstant(hit, latitude, longitude);
  return {
    date: hit,
    ascendant: epochChart.tropicalAscendant,
    moon: norm360(epochChart.tropicalPlanets.find((p) => p.name === "Moon")!.tropicalLongitude),
    note: "Classical conception window used in rectification. Treat as an indicative reference, not a medical date.",
  };
}
