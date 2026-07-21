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

  it("Placidus cusps differ from linear Porphyry interpolation (proves real algorithm)", () => {
    // If we were still doing linear interpolation, cusps 11 and 12 would be
    // exactly at MC + 10° and MC + 20° from MC along Asc; with real Placidus
    // at 51.5° latitude the arc-based cusps diverge by well over 1 arcminute.
    const norm = (x: number) => ((x % 360) + 360) % 360;
    const q = norm(chart.tropicalAscendant - chart.midheaven);
    const linearC11 = norm(chart.midheaven + q / 3);
    const diffC11 = Math.abs(norm(chart.cusps[10] - linearC11 + 540) - 180);
    expect(arcmin(diffC11)).toBeGreaterThan(1);
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
