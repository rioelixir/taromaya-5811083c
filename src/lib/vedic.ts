// Vedic (sidereal) astronomy calculations.
// Uses astronomy-engine (JPL DE440-grade planetary positions, pure JS)
// plus Lahiri ayanamsa for tropical → sidereal conversion.
// Runs entirely in the browser — no WASM, no ephemeris files.

import * as A from "astronomy-engine";
import {
  DEFAULT_CHART_CONFIG,
  AYANAMSA_OFFSET_FROM_LAHIRI,
  type ChartConfig,
  type Ayanamsa,
} from "./chart-config";

export const RASHIS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export const RASHI_LORDS = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
] as const;

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
] as const;

export const NAKSHATRA_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
] as const;

export type PlanetName =
  | "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn"
  | "Rahu" | "Ketu";

export type Planet = {
  name: PlanetName;
  longitude: number;    // sidereal 0..360
  rashi: number;        // 0..11
  degreeInRashi: number;
  nakshatra: number;    // 0..26
  pada: number;         // 1..4
  retrograde: boolean;
};

export type KundliInput = {
  // Local birth date/time components as entered by the user.
  year: number; month: number; day: number;
  hour: number; minute: number;
  seconds?: number;
  // Timezone offset in hours east of UTC (e.g. India = 5.5).
  tzOffsetHours: number;
  latitude: number;
  longitude: number;
  /** Optional; defaults to Lahiri + True Node + Whole Sign. */
  config?: Partial<ChartConfig>;
};

export type KundliChart = {
  ayanamsa: number;
  ascendant: { longitude: number; rashi: number; degreeInRashi: number };
  planets: Planet[];
  moonNakshatra: { index: number; pada: number; lord: string };
  // houses: rashi index of each of the 12 bhavas (whole-sign, from Lagna)
  houses: number[];
};

const AE_BODY: Record<Exclude<PlanetName, "Rahu" | "Ketu">, A.Body> = {
  Sun: A.Body.Sun,
  Moon: A.Body.Moon,
  Mars: A.Body.Mars,
  Mercury: A.Body.Mercury,
  Jupiter: A.Body.Jupiter,
  Venus: A.Body.Venus,
  Saturn: A.Body.Saturn,
};

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;

// Julian centuries since J2000.0.
function tCenturies(date: Date): number {
  const jd = 2440587.5 + date.getTime() / 86400000;
  return (jd - 2451545.0) / 36525;
}

// Lahiri (Chitrapaksha) ayanamsa in degrees.
// Anchored to Swiss Ephemeris SE_SIDM_LAHIRI: 23°51'11.6" = 23.853222° at J2000.0.
// Rate: 50.28796"/yr (matches Chitra-paksha proper motion of Spica).
// Higher-order terms (Simon 1994) keep accuracy to ~0.1" over 1900–2100.
export function lahiriAyanamsa(date: Date): number {
  const T = tCenturies(date);
  return (
    23.853222 +
    T * (5028.796195 / 3600) +
    T * T * (1.1054348 / 3600) -
    T * T * T * (0.00007964 / 3600)
  );
}

// Mean obliquity of the ecliptic (IAU 2006 / Laskar).
function meanObliquity(date: Date): number {
  const T = tCenturies(date);
  const arcsec =
    84381.406 -
    46.836769 * T -
    0.0001831 * T * T +
    0.00200340 * T * T * T -
    5.76e-7 * T * T * T * T -
    4.34e-8 * T * T * T * T * T;
  return arcsec / 3600;
}

// Mean lunar ascending node (Rahu) — tropical longitude, IAU 2000.
function meanNodeTropical(date: Date): number {
  const T = tCenturies(date);
  return norm360(
    125.0445479 -
      1934.1362891 * T +
      0.0020754 * T * T +
      (T * T * T) / 467441 -
      (T * T * T * T) / 60616000,
  );
}

// True (apparent) node — mean node plus dominant lunar perturbations.
// Terms from Chapront-Touzé & Chapront (ELP2000). Accurate to ~1 arcmin.
function trueNodeTropical(date: Date, sunLong: number, moonLong: number): number {
  const T = tCenturies(date);
  const mean = meanNodeTropical(date);
  const D = deg2rad(norm360(moonLong - sunLong)); // mean elongation
  // Sun's mean anomaly.
  const Ms = deg2rad(norm360(357.5291092 + 35999.0502909 * T));
  // Moon's mean anomaly.
  const Mm = deg2rad(norm360(134.9633964 + 477198.8675055 * T));
  // Moon's argument of latitude.
  const F = deg2rad(norm360(93.2720950 + 483202.0175233 * T));
  const correction =
    -1.4979 * Math.sin(2 * (D - F)) -
    0.1500 * Math.sin(Ms) -
    0.1226 * Math.sin(2 * D) +
    0.1176 * Math.sin(2 * F) -
    0.0801 * Math.sin(2 * (Mm - F));
  return norm360(mean + correction);
}

/** Resolve the ayanamsa in degrees for a given date + configured system. */
export function resolveAyanamsa(date: Date, ayanamsa: Ayanamsa): number {
  if (ayanamsa === "tropical") return 0;
  const base = lahiriAyanamsa(date);
  return base + AYANAMSA_OFFSET_FROM_LAHIRI[ayanamsa];
}

function tropicalLongitude(body: A.Body, date: Date): number {
  // Apparent geocentric ecliptic longitude in ecliptic-of-date (true equinox) frame.
  const gvec = A.GeoVector(body, date, true);
  const rot = A.Rotation_EQJ_ECT(date);
  const e = A.RotateVector(rot, gvec);
  return norm360(rad2deg(Math.atan2(e.y, e.x)));
}

function toParts(sidereal: number) {
  const rashi = Math.floor(sidereal / 30);
  const degreeInRashi = sidereal - rashi * 30;
  const nakshatra = Math.floor(sidereal / (360 / 27));
  const pada = Math.floor((sidereal % (360 / 27)) / (360 / 108)) + 1;
  return { rashi, degreeInRashi, nakshatra, pada };
}

// Ascendant longitude (tropical) from LST and geographic latitude.
function ascendantTropical(date: Date, lat: number, lonEast: number): number {
  // GMST in degrees.
  const gmstHours = A.SiderealTime(date); // hours
  const lstDeg = norm360(gmstHours * 15 + lonEast);
  const eps = deg2rad(meanObliquity(date));
  const ramc = deg2rad(lstDeg);
  const phi = deg2rad(lat);
  // Standard ascendant formula.
  const y = -Math.cos(ramc);
  const x = Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(ramc);
  let asc = rad2deg(Math.atan2(y, x));
  asc = norm360(asc);
  return asc;
}

/** Throws on missing / non-finite / out-of-range inputs so downstream
 *  code never silently produces NaN charts. */
export function validateKundliInput(input: KundliInput): void {
  const req = ["year", "month", "day", "hour", "minute", "tzOffsetHours", "latitude", "longitude"] as const;
  for (const k of req) {
    const v = (input as unknown as Record<string, number>)[k];
    if (v === undefined || v === null || !Number.isFinite(v)) {
      throw new Error(`Invalid birth input: ${k} is required and must be a finite number`);
    }
  }
  if (input.year < 1600 || input.year > 2999) throw new Error("Year must be between 1600 and 2999");
  if (input.month < 1 || input.month > 12) throw new Error("Month must be 1..12");
  if (input.day < 1 || input.day > 31) throw new Error("Day must be 1..31");
  if (input.hour < 0 || input.hour > 23) throw new Error("Hour must be 0..23");
  if (input.minute < 0 || input.minute > 59) throw new Error("Minute must be 0..59");
  if (input.tzOffsetHours < -14 || input.tzOffsetHours > 14) throw new Error("Timezone offset out of range");
  if (input.latitude < -90 || input.latitude > 90) throw new Error("Latitude must be -90..90");
  if (input.longitude < -180 || input.longitude > 180) throw new Error("Longitude must be -180..180");
  // Round-trip date check to reject Feb 30 etc.
  const dt = new Date(Date.UTC(input.year, input.month - 1, input.day));
  if (dt.getUTCFullYear() !== input.year || dt.getUTCMonth() !== input.month - 1 || dt.getUTCDate() !== input.day) {
    throw new Error("Impossible calendar date");
  }
}

export function computeKundli(input: KundliInput): KundliChart {
  validateKundliInput(input);
  const cfg = { ...DEFAULT_CHART_CONFIG, ...(input.config ?? {}) };
  // Convert local birth time → UTC Date.
  const localMs = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    input.seconds ?? 0,
  );
  const utcMs = localMs - input.tzOffsetHours * 3600 * 1000;
  const date = new Date(utcMs);

  const ayan = resolveAyanamsa(date, cfg.ayanamsa);

  // Planets (Sun..Saturn) — tropical, then sidereal.
  const bodies: PlanetName[] = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
  let sunTrop = 0, moonTrop = 0;
  const planets: Planet[] = bodies.map((name) => {
    const b = AE_BODY[name as Exclude<PlanetName,"Rahu"|"Ketu">];
    const tropNow = tropicalLongitude(b, date);
    const tropNext = tropicalLongitude(b, new Date(date.getTime() + 86400000));
    const delta = ((tropNext - tropNow + 540) % 360) - 180;
    const retrograde = name !== "Sun" && name !== "Moon" && delta < 0;
    const sid = norm360(tropNow - ayan);
    const parts = toParts(sid);
    if (name === "Sun") sunTrop = tropNow;
    if (name === "Moon") moonTrop = tropNow;
    return {
      name,
      longitude: sid,
      rashi: parts.rashi,
      degreeInRashi: parts.degreeInRashi,
      nakshatra: parts.nakshatra,
      pada: parts.pada,
      retrograde,
    };
  });

  // Rahu/Ketu — Mean or True node depending on config.
  const rahuTrop = cfg.nodeType === "true"
    ? trueNodeTropical(date, sunTrop, moonTrop)
    : meanNodeTropical(date);
  const rahuSid = norm360(rahuTrop - ayan);
  const ketuSid = norm360(rahuSid + 180);
  const rahuParts = toParts(rahuSid);
  const ketuParts = toParts(ketuSid);
  planets.push({
    name: "Rahu", longitude: rahuSid, ...rahuParts, retrograde: true,
  });
  planets.push({
    name: "Ketu", longitude: ketuSid, ...ketuParts, retrograde: true,
  });

  // Ascendant.
  const ascTrop = ascendantTropical(date, input.latitude, input.longitude);
  const ascSid = norm360(ascTrop - ayan);
  const ascParts = toParts(ascSid);

  // Whole-sign houses from Lagna rashi.
  const houses = Array.from({ length: 12 }, (_, i) => (ascParts.rashi + i) % 12);

  const moon = planets[1];
  return {
    ayanamsa: ayan,
    ascendant: { longitude: ascSid, rashi: ascParts.rashi, degreeInRashi: ascParts.degreeInRashi },
    planets,
    moonNakshatra: {
      index: moon.nakshatra,
      pada: moon.pada,
      lord: NAKSHATRA_LORDS[moon.nakshatra],
    },
    houses,
  };
}

export function formatDegree(d: number): string {
  const deg = Math.floor(d);
  const minFloat = (d - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = Math.round((minFloat - min) * 60);
  return `${deg}°${String(min).padStart(2, "0")}′${String(sec).padStart(2, "0")}″`;
}

export const PLANET_GLYPHS: Record<PlanetName, string> = {
  Sun: "☉", Moon: "☾", Mars: "♂", Mercury: "☿", Jupiter: "♃",
  Venus: "♀", Saturn: "♄", Rahu: "☊", Ketu: "☋",
};

export const PLANET_SHORT: Record<PlanetName, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
  Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
};
