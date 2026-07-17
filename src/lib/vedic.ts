// Vedic (sidereal) astronomy calculations.
// Uses astronomy-engine (JPL DE440-grade planetary positions, pure JS)
// plus Lahiri ayanamsa for tropical → sidereal conversion.
// Runs entirely in the browser — no WASM, no ephemeris files.

import * as A from "astronomy-engine";

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
  // Timezone offset in hours east of UTC (e.g. India = 5.5).
  tzOffsetHours: number;
  latitude: number;
  longitude: number;
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

// Lahiri ayanamsa in degrees. Anchored to Chitrapaksha value at J2000.
export function lahiriAyanamsa(date: Date): number {
  const T = tCenturies(date);
  // ~23.85° at J2000, precession ~50.2909"/yr; small non-linear term.
  return 23.85 + T * (5029.0966 / 3600) - T * T * (1.1113 / 3600);
}

// Mean obliquity of the ecliptic (Laskar / IAU).
function meanObliquity(date: Date): number {
  const T = tCenturies(date);
  const eps =
    23.439291 - 0.0130042 * T - 1.64e-7 * T * T + 5.036e-7 * T * T * T;
  return eps;
}

// Mean lunar ascending node (Rahu) — tropical longitude.
function meanNodeTropical(date: Date): number {
  const T = tCenturies(date);
  return norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
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

export function computeKundli(input: KundliInput): KundliChart {
  // Convert local birth time → UTC Date.
  const localMs = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    0,
  );
  const utcMs = localMs - input.tzOffsetHours * 3600 * 1000;
  const date = new Date(utcMs);

  const ayan = lahiriAyanamsa(date);

  // Planets (Sun..Saturn) — tropical, then sidereal.
  const bodies: PlanetName[] = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
  const planets: Planet[] = bodies.map((name) => {
    const b = AE_BODY[name as Exclude<PlanetName,"Rahu"|"Ketu">];
    const tropNow = tropicalLongitude(b, date);
    const tropNext = tropicalLongitude(b, new Date(date.getTime() + 86400000));
    const delta = ((tropNext - tropNow + 540) % 360) - 180;
    const retrograde = name !== "Sun" && name !== "Moon" && delta < 0;
    const sid = norm360(tropNow - ayan);
    const parts = toParts(sid);
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

  // Rahu (mean node) — always retrograde in mean-node model. Ketu = Rahu + 180.
  const rahuTrop = meanNodeTropical(date);
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
