// Secondary Progressions & Solar Return charts.
// Both are computed by feeding a synthetic "birth" moment into
// computeWesternChart so we reuse the full aspect/wheel pipeline.

import * as A from "astronomy-engine";
import { computeWesternChart, type WesternChart, type HouseSystem } from "./western";

export type BirthInput = {
  year: number; month: number; day: number;
  hour: number; minute: number;
  tzOffsetHours: number;
  latitude: number; longitude: number;
};

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const rad2deg = (r: number) => (r * 180) / Math.PI;

function sunTropicalLon(date: Date): number {
  const g = A.GeoVector(A.Body.Sun, date, true);
  const rot = A.Rotation_EQJ_ECT(date);
  const e = A.RotateVector(rot, g);
  return norm360(rad2deg(Math.atan2(e.y, e.x)));
}

function birthUtcMs(b: BirthInput): number {
  return Date.UTC(b.year, b.month - 1, b.day, b.hour, b.minute) - b.tzOffsetHours * 3600000;
}

function utcDateToInput(d: Date, lat: number, lon: number): BirthInput {
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    tzOffsetHours: 0,
    latitude: lat, longitude: lon,
  };
}

// ── Secondary Progressions (1 day = 1 year of life)
export function progressedChart(
  birth: BirthInput,
  target: Date = new Date(),
  houseSystem: HouseSystem = "placidus",
): { chart: WesternChart; progressedAt: Date; ageYears: number } {
  const b = birthUtcMs(birth);
  const ageYears = (target.getTime() - b) / (365.2422 * 86400000);
  const progressedAt = new Date(b + ageYears * 86400000);
  const chart = computeWesternChart(
    utcDateToInput(progressedAt, birth.latitude, birth.longitude),
    houseSystem,
  );
  return { chart, progressedAt, ageYears };
}

// ── Solar Return: moment when transiting Sun exactly returns to natal Sun.
export function solarReturnChart(
  birth: BirthInput,
  natalSunLongitudeTropical: number,
  targetYear: number,
  location?: { latitude: number; longitude: number },
  houseSystem: HouseSystem = "placidus",
): { chart: WesternChart; returnAt: Date } {
  const lat = location?.latitude ?? birth.latitude;
  const lon = location?.longitude ?? birth.longitude;

  const diff = (d: Date) => {
    let x = sunTropicalLon(d) - natalSunLongitudeTropical;
    while (x > 180) x -= 360;
    while (x < -180) x += 360;
    return x;
  };

  // Wide bracket around birthday of target year.
  let a = Date.UTC(targetYear, birth.month - 1, birth.day) - 5 * 86400000;
  let b = a + 15 * 86400000;
  let fa = diff(new Date(a));
  let fb = diff(new Date(b));

  // Expand if no sign change (rare, but guard).
  let tries = 0;
  while (fa * fb > 0 && tries < 6) {
    a -= 5 * 86400000; b += 5 * 86400000;
    fa = diff(new Date(a)); fb = diff(new Date(b));
    tries++;
  }

  for (let i = 0; i < 60; i++) {
    const mid = (a + b) / 2;
    const fm = diff(new Date(mid));
    if (fa * fm <= 0) { b = mid; fb = fm; } else { a = mid; fa = fm; }
    if (Math.abs(fm) < 1e-6) break;
  }
  const returnAt = new Date((a + b) / 2);
  const chart = computeWesternChart(utcDateToInput(returnAt, lat, lon), houseSystem);
  return { chart, returnAt };
}
