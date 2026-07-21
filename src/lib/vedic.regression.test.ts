import { describe, it, expect } from "vitest";
import { computeKundli } from "./vedic";

const RASHIS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

// Reference: India Independence, 15 Aug 1947, 00:00 IST, New Delhi.
// Widely-published Lahiri sidereal chart → Ascendant: Vrishabha (Taurus).
// This is our canonical Lagna regression: if this ever drifts, the ascendant
// pipeline (LST, obliquity, ayanamsa, or sign bucketing) has regressed.
describe("Kundli engine — canonical regression", () => {
  const chart = computeKundli({
    year: 1947, month: 8, day: 15, hour: 0, minute: 0, seconds: 0,
    tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.2090,
  });

  it("Ascendant rashi = Taurus (Vrishabha) for India Independence chart", () => {
    expect(RASHIS[chart.ascendant.rashi]).toBe("Taurus");
  });

  it("Ascendant degree within Taurus is finite and in [0,30)", () => {
    expect(Number.isFinite(chart.ascendant.degreeInRashi)).toBe(true);
    expect(chart.ascendant.degreeInRashi).toBeGreaterThanOrEqual(0);
    expect(chart.ascendant.degreeInRashi).toBeLessThan(30);
  });

  it("houses array follows whole-sign rotation from Lagna", () => {
    for (let i = 0; i < 12; i++) {
      expect(chart.houses[i]).toBe((chart.ascendant.rashi + i) % 12);
    }
  });

  it("Rahu and Ketu are exactly 180° apart", () => {
    const rahu = chart.planets.find((p) => p.name === "Rahu")!;
    const ketu = chart.planets.find((p) => p.name === "Ketu")!;
    const diff = ((rahu.longitude - ketu.longitude) % 360 + 360) % 360;
    expect(Math.min(diff, 360 - diff)).toBeCloseTo(180, 3);
  });

  it("every planet appears exactly once", () => {
    const names = chart.planets.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toHaveLength(9); // Su, Mo, Ma, Me, Ju, Ve, Sa, Ra, Ke
  });

  it("moonNakshatra matches the Moon's sidereal longitude", () => {
    const moon = chart.planets.find((p) => p.name === "Moon")!;
    const nak = Math.floor(moon.longitude / (360 / 27));
    expect(chart.moonNakshatra.index).toBe(nak);
  });
});

// All 12 possible Lagnas: run 12 charts spaced through the day and verify each
// ascendant is a valid rashi and the whole-sign house wheel is well-formed.
describe("Kundli engine — 12-Lagna sweep", () => {
  const seen = new Set<number>();
  for (let h = 0; h < 24; h += 2) {
    const chart = computeKundli({
      year: 2000, month: 6, day: 21, hour: h, minute: 0, seconds: 0,
      tzOffsetHours: 5.5, latitude: 19.076, longitude: 72.877, // Mumbai
    });
    seen.add(chart.ascendant.rashi);
    it(`h=${h} produces a valid ascendant + whole-sign wheel`, () => {
      expect(chart.ascendant.rashi).toBeGreaterThanOrEqual(0);
      expect(chart.ascendant.rashi).toBeLessThan(12);
      expect(new Set(chart.houses).size).toBe(12);
    });
  }
  it("sweep covers at least 10 distinct Lagnas across the day", () => {
    expect(seen.size).toBeGreaterThanOrEqual(10);
  });
});
