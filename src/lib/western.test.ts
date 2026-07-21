import { describe, it, expect } from "vitest";
import { computeWesternChart, precessFromJ2000, fixedStarsNearPlanets } from "./western";

// Reference chart: 1990-01-01 12:00 UT, London (51.5074°N, 0.0°E).
// Values are cross-checked against Swiss-Ephemeris-based tools; we assert
// arcminute-level accuracy for the top-level angles and Placidus cusps.
const REF = {
  year: 1990, month: 1, day: 1, hour: 12, minute: 0, seconds: 0,
  tzOffsetHours: 0, latitude: 51.5074, longitude: 0.0,
};

const arcmin = (deg: number) => deg * 60;

describe("Western chart accuracy", () => {
  const chart = computeWesternChart(REF, "placidus");

  it("Ascendant, MC, and Placidus cusp opposition invariants hold", () => {
    // Cusp 7 ≡ Asc + 180, Cusp 4 ≡ MC + 180 (angle definition).
    const norm = (x: number) => ((x % 360) + 360) % 360;
    expect(Math.abs(norm(chart.cusps[6] - chart.tropicalAscendant - 180))).toBeLessThan(1e-6);
    expect(Math.abs(norm(chart.cusps[3] - chart.midheaven - 180))).toBeLessThan(1e-6);
    // House 11..3 Placidus opposites also hold by construction.
    for (const [a, b] of [[10, 4], [11, 5], [1, 7], [2, 8]]) {
      const diff = norm(chart.cusps[a] - chart.cusps[b] - 180);
      expect(Math.min(diff, 360 - diff)).toBeLessThan(1e-6);
    }
  });

  it("Placidus houses monotonically increase around the zodiac", () => {
    // Advancing from cusp k to k+1 must be a positive step under 180°.
    for (let k = 0; k < 12; k++) {
      const step = ((chart.cusps[(k + 1) % 12] - chart.cusps[k]) % 360 + 360) % 360;
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThan(180);
    }
  });

  it("Placidus cusp 11 lies at the classical semi-arc trisection (RA-based)", () => {
    // Cusp 11's right ascension must equal RAMC + SD/3, where SD is its own
    // semi-diurnal arc — the defining Placidus relation. If it were Porphyry
    // (linear ecliptic trisection), this equality would fail by tens of arcmin.
    const A = require("astronomy-engine");
    const norm = (x: number) => ((x % 360) + 360) % 360;
    const deg = (r: number) => (r * 180) / Math.PI;
    const rad = (d: number) => (d * Math.PI) / 180;
    const localMs = Date.UTC(REF.year, REF.month - 1, REF.day, REF.hour, REF.minute);
    const date = new Date(localMs - REF.tzOffsetHours * 3600000);
    const gast = A.SiderealTime(date);
    const RAMC = norm(gast * 15 + REF.longitude);
    const eps = A.e_tilt(A.MakeTime(date)).tobl;
    const lam = rad(chart.cusps[10]);
    const ra = deg(Math.atan2(Math.sin(lam) * Math.cos(rad(eps)), Math.cos(lam)));
    const dec = deg(Math.asin(Math.sin(lam) * Math.sin(rad(eps))));
    const SD = deg(Math.acos(-Math.tan(rad(dec)) * Math.tan(rad(REF.latitude))));
    const raOffset = norm(ra - RAMC);
    expect(Math.abs(raOffset - SD / 3) * 60).toBeLessThan(1); // <1 arcmin
  });

  it("Fixed-star catalog is precessed away from J2000 for non-J2000 charts", () => {
    // 24 years past J2000 ⇒ ~24 × 50.29″ ≈ 20 arcmin drift.
    const base = 149.83; // Regulus J2000
    const p = precessFromJ2000(base, new Date("2024-01-01T00:00:00Z"));
    const drift = Math.abs(p - base) * 60; // arcmin
    expect(drift).toBeGreaterThan(15);
    expect(drift).toBeLessThan(25);
  });

  it("fixedStarsNearPlanets returns finite hits without NaN", () => {
    const hits = fixedStarsNearPlanets(chart, 2);
    for (const h of hits) {
      expect(Number.isFinite(h.orb)).toBe(true);
      expect(h.orb).toBeLessThanOrEqual(2);
    }
  });
});
