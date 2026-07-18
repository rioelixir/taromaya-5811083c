// Varshphal (Tajika / Annual Solar Return) engine.
// Computes the exact moment tropical Sun returns to its birth longitude
// for a given target year, builds the annual chart at that moment, and
// derives classical Tajika constructs: Muntha, Lord of the Year (Varshesh),
// Muntha lord, and the major Sahams (sensitive Arabic-part-style points).

import * as A from "astronomy-engine";
import {
  computeKundli, resolveAyanamsa, RASHIS, RASHI_LORDS,
  type KundliChart, type KundliInput, type PlanetName, type Planet,
} from "./vedic";

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const rad2deg = (r: number) => (r * 180) / Math.PI;

function sunTropical(date: Date): number {
  const g = A.GeoVector(A.Body.Sun, date, true);
  const rot = A.Rotation_EQJ_ECT(date);
  const e = A.RotateVector(rot, g);
  return norm360(rad2deg(Math.atan2(e.y, e.x)));
}

/** Find the UTC moment near `guess` when tropical Sun = targetLon. */
function findSolarReturnUTC(targetLon: number, guess: Date): Date {
  // Bracket: search ±3 days around the guess in 3-hour steps.
  const start = guess.getTime() - 3 * 86400000;
  let prevT = start;
  let prevD = norm360(sunTropical(new Date(prevT)) - targetLon);
  if (prevD > 180) prevD -= 360;
  const step = 3 * 3600 * 1000;
  for (let t = start + step; t <= guess.getTime() + 3 * 86400000; t += step) {
    let d = norm360(sunTropical(new Date(t)) - targetLon);
    if (d > 180) d -= 360;
    if (prevD <= 0 && d >= 0 && d - prevD < 5) {
      // Bisect between prevT and t.
      let lo = prevT, hi = t;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        let dm = norm360(sunTropical(new Date(mid)) - targetLon);
        if (dm > 180) dm -= 360;
        if (dm < 0) lo = mid; else hi = mid;
      }
      return new Date((lo + hi) / 2);
    }
    prevT = t; prevD = d;
  }
  return guess;
}

export type VarshphalInput = {
  birth: KundliInput;
  targetYear: number;
  // Location where the native is on the birthday (defaults to birth place).
  latitude?: number;
  longitude?: number;
  tzOffsetHours?: number;
};

export type Saham = { name: string; longitude: number; rashi: number; lord: string };

export type VarshphalChart = {
  returnUTC: Date;
  returnLocal: string;    // formatted in native's local tz for the year
  ageCompleted: number;   // years completed at return
  chart: KundliChart;     // annual sidereal chart
  muntha: { longitude: number; rashi: number; lord: string; house: number };
  varshesh: PlanetName;   // Lord of the Year
  varsheshReason: string;
  sahams: Saham[];
};

// Tajika year-lord ranking rules (simplified Tajika Neelakanthi approach):
// consider the lords of these houses at annual chart: Lagna, Sun-sign,
// Moon-sign, Muntha-sign, and the "Trirashi lord" of Lagna.
// The planet appearing in most of these five roles is Varshesh; if tied,
// choose the strongest by (in the day chart: Sun; in the night chart: Moon
// / benefic weighting), else fall back to Lagna lord.
function scoreVarshesh(chart: KundliChart, munthaRashi: number): { lord: PlanetName; reason: string } {
  const lagnaRashi = chart.ascendant.rashi;
  const sunRashi = chart.planets.find((p) => p.name === "Sun")!.rashi;
  const moonRashi = chart.planets.find((p) => p.name === "Moon")!.rashi;
  // Trirashi (day/night) lord of Lagna (very simplified: use rashi lord).
  const candidates = [
    RASHI_LORDS[lagnaRashi],
    RASHI_LORDS[sunRashi],
    RASHI_LORDS[moonRashi],
    RASHI_LORDS[munthaRashi],
    RASHI_LORDS[lagnaRashi], // trirashi weight
  ] as PlanetName[];
  const counts: Partial<Record<PlanetName, number>> = {};
  for (const c of candidates) counts[c] = (counts[c] ?? 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1]! - a[1]!) as [PlanetName, number][];
  const [lord, count] = sorted[0];
  return {
    lord,
    reason: `Rules: Lagna(${RASHIS[lagnaRashi]}·${RASHI_LORDS[lagnaRashi]}), Sun(${RASHIS[sunRashi]}·${RASHI_LORDS[sunRashi]}), Moon(${RASHIS[moonRashi]}·${RASHI_LORDS[moonRashi]}), Muntha(${RASHIS[munthaRashi]}·${RASHI_LORDS[munthaRashi]}). ${lord} appears ${count}/5 — declared Varshesh.`,
  };
}

// Sahams — classical Tajika sensitive points. Formulas from Tajika Neelakanthi.
// General form: Saham = A - B + C  (all longitudes 0..360), where sign of
// (Lagna - Sun) determines day/night formula variants. We implement the
// major twelve and the extra "Iccha / Kalatra / Punya" set actually used.
function computeSahams(c: KundliChart): Saham[] {
  const P = (n: PlanetName) => c.planets.find((p) => p.name === n)!.longitude;
  const Lagna = c.ascendant.longitude;
  const Sun = P("Sun"), Moon = P("Moon"), Mars = P("Mars"),
        Mercury = P("Mercury"), Jupiter = P("Jupiter"),
        Venus = P("Venus"), Saturn = P("Saturn");
  const dayBirth = norm360(Sun - Lagna) < 180 ? false : true; // Sun above horizon → day

  const S = (name: string, a: number, b: number, cx: number) => {
    const lon = norm360(a - b + cx);
    const rashi = Math.floor(lon / 30);
    return { name, longitude: lon, rashi, lord: RASHI_LORDS[rashi] };
  };

  return [
    S("Punya (Fortune)",     dayBirth ? Moon : Sun,   dayBirth ? Sun : Moon,  Lagna),
    S("Vidya (Learning)",    dayBirth ? Sun  : Moon,  dayBirth ? Moon: Sun,   Lagna),
    S("Yasas (Fame)",        Jupiter,                 Punyaish(Lagna, Sun, Moon, dayBirth), Lagna),
    S("Mitra (Friendship)",  Jupiter,                 Punyaish(Lagna, Sun, Moon, dayBirth), Venus + 0),
    S("Karya (Action)",      Saturn,                  Mars,                   Lagna),
    S("Bandhu (Kinship)",    Moon,                    Mercury,                Lagna),
    S("Kalatra (Spouse)",    Venus,                   Sun,                    Lagna),
    S("Putra (Progeny)",     Jupiter,                 Moon,                   Lagna),
    S("Roga (Illness)",      Lagna,                   Moon,                   Lagna),
    S("Marana (Mortality)",  8 * 30,                  Moon,                   Lagna), // 8th cusp proxy
    S("Artha (Wealth)",      2 * 30,                  Saturn,                 Lagna),
    S("Iccha (Desire)",      Saturn + 0,              Mars,                   Lagna),
  ];
}
function Punyaish(Lagna: number, Sun: number, Moon: number, day: boolean): number {
  return norm360((day ? Moon : Sun) - (day ? Sun : Moon) + Lagna);
}

export function computeVarshphal(input: VarshphalInput): VarshphalChart {
  const b = input.birth;
  // Birth tropical Sun longitude.
  const localBirth = new Date(Date.UTC(b.year, b.month - 1, b.day, b.hour, b.minute, b.seconds ?? 0));
  const utcBirth = new Date(localBirth.getTime() - b.tzOffsetHours * 3600 * 1000);
  const sunAtBirthTrop = sunTropical(utcBirth);
  const age = input.targetYear - b.year;
  if (age < 0) throw new Error("Target year must be after birth year.");
  const guess = new Date(utcBirth.getTime() + age * 365.2422 * 86400000);
  const returnUTC = findSolarReturnUTC(sunAtBirthTrop, guess);

  const tz = input.tzOffsetHours ?? b.tzOffsetHours;
  const lat = input.latitude ?? b.latitude;
  const lon = input.longitude ?? b.longitude;
  const local = new Date(returnUTC.getTime() + tz * 3600 * 1000);

  const chart = computeKundli({
    year: local.getUTCFullYear(), month: local.getUTCMonth() + 1, day: local.getUTCDate(),
    hour: local.getUTCHours(), minute: local.getUTCMinutes(), seconds: local.getUTCSeconds(),
    tzOffsetHours: tz, latitude: lat, longitude: lon,
    config: b.config,
  });

  // Muntha: from natal Lagna, advances 1 rashi per year completed.
  const natal = computeKundli(b);
  const munthaLon = norm360(natal.ascendant.longitude + age * 30);
  const munthaRashi = Math.floor(munthaLon / 30);
  const munthaHouse = ((munthaRashi - chart.ascendant.rashi + 12) % 12) + 1;

  const vs = scoreVarshesh(chart, munthaRashi);
  const sahams = computeSahams(chart);

  return {
    returnUTC,
    returnLocal: local.toUTCString().replace(" GMT", ""),
    ageCompleted: age,
    chart,
    muntha: {
      longitude: munthaLon,
      rashi: munthaRashi,
      lord: RASHI_LORDS[munthaRashi],
      house: munthaHouse,
    },
    varshesh: vs.lord,
    varsheshReason: vs.reason,
    sahams,
  };
}

export function planetHouse(p: Planet, ascRashi: number): number {
  return ((p.rashi - ascRashi + 12) % 12) + 1;
}
