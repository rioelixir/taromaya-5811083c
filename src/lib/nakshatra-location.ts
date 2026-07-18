// Nakshatra For Location — engine.
// Given (date, latitude, longitude) compute Moon/Sun/Ascendant nakshatra,
// active nakshatra window with precise entry/exit times, upcoming timeline,
// and location-sensitive flags (Ganda Moola, Panchak, Chandrashtama, Moon
// rise/set at that place). All longitudes are Lahiri-sidereal.

import * as A from "astronomy-engine";
import { NAKSHATRAS, lahiriAyanamsa } from "./vedic";

const NAK_SPAN = 360 / 27; // 13°20'
const norm360 = (x: number) => ((x % 360) + 360) % 360;
const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;

function tropicalLon(body: A.Body, date: Date): number {
  const g = A.GeoVector(body, date, true);
  const rot = A.Rotation_EQJ_ECT(date);
  const e = A.RotateVector(rot, g);
  return norm360(Math.atan2(e.y, e.x) * 180 / Math.PI);
}

function siderealLon(body: A.Body, date: Date): number {
  return norm360(tropicalLon(body, date) - lahiriAyanamsa(date));
}

// Julian Day from JS Date (UTC).
function jd(date: Date): number {
  return 2440587.5 + date.getTime() / 86400000;
}

// Greenwich Mean Sidereal Time in degrees.
function gmstDeg(date: Date): number {
  const J = jd(date);
  const T = (J - 2451545.0) / 36525;
  const g =
    280.46061837 +
    360.98564736629 * (J - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return norm360(g);
}

// Mean obliquity of the ecliptic in degrees.
function obliquityDeg(date: Date): number {
  const T = (jd(date) - 2451545.0) / 36525;
  return (
    23.439291111 -
    (46.8150 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600
  );
}

// Tropical ascendant longitude (deg) at latitude/longitude.
function tropicalAscendant(date: Date, latitude: number, longitude: number): number {
  const lst = norm360(gmstDeg(date) + longitude); // deg
  const th = deg2rad(lst);
  const ep = deg2rad(obliquityDeg(date));
  const ph = deg2rad(latitude);
  // Standard formula
  let lam = Math.atan2(-Math.cos(th), Math.sin(th) * Math.cos(ep) + Math.tan(ph) * Math.sin(ep));
  let lamDeg = norm360(rad2deg(lam));
  // Quadrant correction: ascendant should lead LST by less than 180°.
  if (norm360(lamDeg - lst) > 180) lamDeg = norm360(lamDeg + 180);
  return lamDeg;
}

function siderealAscendant(date: Date, latitude: number, longitude: number): number {
  return norm360(tropicalAscendant(date, latitude, longitude) - lahiriAyanamsa(date));
}

// Nakshatra pada lord table (Vimshottari lords in order).
const NAK_LORDS = [
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
  "Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury",
];

// Ganda Moola nakshatras (birth cautions): Ashwini (0), Ashlesha (8),
// Magha (9), Jyeshtha (17), Mula (18), Revati (26).
const GANDA_MOOLA = new Set([0, 8, 9, 17, 18, 26]);

// Panchak: Dhanishta latter half (index 22 second half) through Revati (26).
// We flag the full nakshatras 23..26; Dhanishta half we treat as partial.
function isPanchakIndex(i: number, deg?: number): boolean {
  if (i >= 23 && i <= 26) return true;
  if (i === 22 && deg !== undefined && deg >= NAK_SPAN / 2) return true;
  return false;
}

export type NakshatraSnapshot = {
  index: number;
  name: string;
  pada: 1 | 2 | 3 | 4;
  lord: string;
  degInNak: number;      // 0..13.333
  progress: number;      // 0..1
  entry: Date | null;    // when Moon entered this nakshatra
  exit: Date | null;     // when Moon leaves it
  minutesToNextPada: number | null;
  minutesToExit: number | null;
};

export type LocationSnapshot = {
  at: Date;
  latitude: number;
  longitude: number;
  ayanamsa: number;
  moon: NakshatraSnapshot;
  sun: { index: number; name: string; degInNak: number; lord: string };
  lagna: { index: number; name: string; degInNak: number; lord: string; pada: 1 | 2 | 3 | 4 };
  moonRise: Date | null;
  moonSet: Date | null;
  isGandaMoola: boolean;
  isPanchak: boolean;
  chandrashtama: string[]; // 8th, 17th, 22nd nakshatras from Moon
  upcoming: { name: string; from: Date; to: Date; index: number }[]; // next N transitions
  moonSpeed: number; // °/day sidereal
};

function moonNakIndex(date: Date): { index: number; deg: number; lon: number } {
  const lon = siderealLon(A.Body.Moon, date);
  const i = Math.floor(lon / NAK_SPAN);
  return { index: i, deg: lon - i * NAK_SPAN, lon };
}

// Refine time when Moon crosses boundary at `targetLon` (deg) between t0 & t1.
function refineBoundary(targetLon: number, t0: Date, t1: Date): Date {
  let lo = t0.getTime(), hi = t1.getTime();
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    const md = new Date(mid);
    const lon = siderealLon(A.Body.Moon, md);
    // signed distance from targetLon in (-180, 180)
    const diff = ((lon - targetLon + 540) % 360) - 180;
    // Moon moves eastward; if it hasn't reached target yet diff < 0.
    if (diff < 0) lo = mid;
    else hi = mid;
    if (hi - lo < 500) break; // ms precision
  }
  return new Date((lo + hi) / 2);
}

// Search backward for the entry time of the current nakshatra.
function findNakEntry(now: Date, currentIndex: number): Date {
  const target = currentIndex * NAK_SPAN;
  // Step back up to 30 hours in 20-min chunks.
  let t1 = new Date(now);
  for (let step = 0; step < 100; step++) {
    const t0 = new Date(t1.getTime() - 20 * 60 * 1000);
    const idx0 = Math.floor(siderealLon(A.Body.Moon, t0) / NAK_SPAN);
    if (idx0 !== currentIndex) {
      return refineBoundary(target, t0, t1);
    }
    t1 = t0;
  }
  return new Date(now.getTime() - 30 * 3600 * 1000);
}

function findNakExit(now: Date, currentIndex: number): Date {
  const target = ((currentIndex + 1) % 27) * NAK_SPAN;
  let t0 = new Date(now);
  for (let step = 0; step < 100; step++) {
    const t1 = new Date(t0.getTime() + 20 * 60 * 1000);
    const idx1 = Math.floor(siderealLon(A.Body.Moon, t1) / NAK_SPAN);
    if (idx1 !== currentIndex) {
      return refineBoundary(target, t0, t1);
    }
    t0 = t1;
  }
  return new Date(now.getTime() + 30 * 3600 * 1000);
}

export type NakLocationInput = {
  date: Date;
  latitude: number;
  longitude: number;
  timelineCount?: number;  // number of upcoming nakshatra windows
};

export function computeNakshatraForLocation(input: NakLocationInput): LocationSnapshot {
  const { date, latitude, longitude } = input;
  const count = Math.max(1, Math.min(28, input.timelineCount ?? 9));
  const observer = new A.Observer(latitude, longitude, 0);

  // Moon
  const { index: moonIdx, deg: moonDeg } = moonNakIndex(date);
  const padaSize = NAK_SPAN / 4;
  const pada = (Math.floor(moonDeg / padaSize) + 1) as 1 | 2 | 3 | 4;
  const entry = findNakEntry(date, moonIdx);
  const exit = findNakExit(date, moonIdx);

  // Moon speed (°/day) using ±1h finite difference
  const t1 = new Date(date.getTime() - 3600 * 1000);
  const t2 = new Date(date.getTime() + 3600 * 1000);
  const dLon = ((siderealLon(A.Body.Moon, t2) - siderealLon(A.Body.Moon, t1) + 540) % 360) - 180;
  const moonSpeed = dLon * 12; // per day

  const minutesToExit = Math.max(0, (exit.getTime() - date.getTime()) / 60000);
  const nextPadaBoundaryDeg = (Math.floor(moonDeg / padaSize) + 1) * padaSize;
  const degToNextPada = nextPadaBoundaryDeg - moonDeg;
  const minutesToNextPada = moonSpeed > 0 ? (degToNextPada / moonSpeed) * 24 * 60 : null;

  // Sun
  const sunLon = siderealLon(A.Body.Sun, date);
  const sunIdx = Math.floor(sunLon / NAK_SPAN);

  // Lagna (ascendant)
  const asc = siderealAscendant(date, latitude, longitude);
  const ascIdx = Math.floor(asc / NAK_SPAN);
  const ascDeg = asc - ascIdx * NAK_SPAN;
  const ascPada = (Math.floor(ascDeg / padaSize) + 1) as 1 | 2 | 3 | 4;

  // Moon rise/set at location for the calendar day of `date`.
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const findRise = (dir: 1 | -1) => {
    try {
      const t = A.SearchRiseSet(A.Body.Moon, observer, dir, dayStart, 2);
      return t ? t.date : null;
    } catch { return null; }
  };
  const moonRise = findRise(+1);
  const moonSet = findRise(-1);

  // Upcoming timeline: iterate from `exit` and roll forward `count` nakshatras.
  const upcoming: LocationSnapshot["upcoming"] = [];
  let cursorFrom = exit;
  let cursorIdx = (moonIdx + 1) % 27;
  for (let k = 0; k < count; k++) {
    const inside = new Date(cursorFrom.getTime() + 60000);
    const nextExit = findNakExit(inside, cursorIdx);
    upcoming.push({
      name: NAKSHATRAS[cursorIdx],
      from: cursorFrom,
      to: nextExit,
      index: cursorIdx,
    });
    cursorFrom = nextExit;
    cursorIdx = (cursorIdx + 1) % 27;
  }

  const chandrashtama = [7, 16, 21].map((o) => NAKSHATRAS[(moonIdx + o) % 27]);

  return {
    at: date,
    latitude,
    longitude,
    ayanamsa: lahiriAyanamsa(date),
    moon: {
      index: moonIdx,
      name: NAKSHATRAS[moonIdx],
      pada,
      lord: NAK_LORDS[moonIdx],
      degInNak: moonDeg,
      progress: moonDeg / NAK_SPAN,
      entry,
      exit,
      minutesToNextPada,
      minutesToExit,
    },
    sun: {
      index: sunIdx,
      name: NAKSHATRAS[sunIdx],
      degInNak: sunLon - sunIdx * NAK_SPAN,
      lord: NAK_LORDS[sunIdx],
    },
    lagna: {
      index: ascIdx,
      name: NAKSHATRAS[ascIdx],
      degInNak: ascDeg,
      lord: NAK_LORDS[ascIdx],
      pada: ascPada,
    },
    moonRise,
    moonSet,
    isGandaMoola: GANDA_MOOLA.has(moonIdx),
    isPanchak: isPanchakIndex(moonIdx, moonDeg),
    chandrashtama,
    upcoming,
    moonSpeed,
  };
}

// Find the next window (from `from`) at that location when the given
// nakshatra (by index) is active. Returns { from, to } or null within 30 days.
export function findNextNakshatraWindow(
  nakIndex: number,
  fromDate: Date,
  _latitude: number,
  _longitude: number,
): { from: Date; to: Date } | null {
  const targetEntry = nakIndex * NAK_SPAN;
  // Nakshatras repeat every ~27.3 days.
  const maxMs = 30 * 24 * 3600 * 1000;
  let t0 = new Date(fromDate);
  for (let step = 0; step < 30 * 24 * 3; step++) { // 20-min steps
    const t1 = new Date(t0.getTime() + 20 * 60 * 1000);
    if (t1.getTime() - fromDate.getTime() > maxMs) return null;
    const i0 = Math.floor(siderealLon(A.Body.Moon, t0) / NAK_SPAN);
    const i1 = Math.floor(siderealLon(A.Body.Moon, t1) / NAK_SPAN);
    if (i0 !== nakIndex && i1 === nakIndex) {
      const from = refineBoundary(targetEntry, t0, t1);
      const to = findNakExit(new Date(from.getTime() + 60000), nakIndex);
      return { from, to };
    }
    // Already inside at fromDate
    if (step === 0 && i0 === nakIndex) {
      const to = findNakExit(t0, nakIndex);
      return { from: t0, to };
    }
    t0 = t1;
  }
  return null;
}

// Format helpers.
export function fmtLocalDateTime(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}
export function fmtLocalTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
export function fmtDuration(minutes: number): string {
  if (!isFinite(minutes) || minutes < 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
