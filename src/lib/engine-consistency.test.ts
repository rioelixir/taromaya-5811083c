// Cross-module validation: every reading surface must use the shared backend
// engines, and the same inputs must never produce contradictory results.
//
// Covers: Kundli, transits, nakshatra (birth + place), Vimshottari dasha,
// numerology, tarot interpretation formatting, and report/AI output rules.

import { describe, expect, it } from "vitest";
import { computeKundli, NAKSHATRAS, RASHIS } from "./vedic";
import { computeVimshottari } from "./vedic-extended";
import { computeNakshatraForLocation } from "./nakshatra-location";
import { computeNumerology, lifePathNumber, reduce } from "./numerology";
import { runValidationSuite } from "./engine-validation";
import { PLAIN_ELI10_RULES, parsePlainLines, toPlainText } from "./ai-format";
import { withSupremeSystem } from "./ai-system";

const BIRTH = {
  year: 1990, month: 5, day: 12,
  hour: 14, minute: 35,
  tzOffsetHours: 5.5,
  latitude: 28.6139, longitude: 77.209,
};
const FIXED_NOW = new Date(Date.UTC(2026, 6, 31, 4, 0, 0));

describe("Kundli engine", () => {
  it("is deterministic for identical inputs", () => {
    const a = computeKundli(BIRTH);
    const b = computeKundli({ ...BIRTH });
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });

  it("produces internally consistent signs, houses and nakshatras", () => {
    const c = computeKundli(BIRTH);
    expect(c.ascendant.rashi).toBeGreaterThanOrEqual(0);
    expect(c.ascendant.rashi).toBeLessThan(RASHIS.length);
    expect(c.houses).toHaveLength(12);
    // Whole-sign houses start at the lagna sign and run in order.
    c.houses.forEach((sign, i) => {
      expect(sign).toBe((c.ascendant.rashi + i) % 12);
    });
    for (const p of c.planets) {
      expect(Number.isFinite(p.longitude)).toBe(true);
      expect(p.longitude).toBeGreaterThanOrEqual(0);
      expect(p.longitude).toBeLessThan(360);
      // Sign, degree-in-sign and nakshatra must all agree with the longitude.
      expect(p.rashi).toBe(Math.floor(p.longitude / 30));
      expect(p.degreeInRashi).toBeCloseTo(p.longitude % 30, 6);
      expect(p.nakshatra).toBe(Math.floor(p.longitude / (360 / 27)));
      expect(p.pada).toBeGreaterThanOrEqual(1);
      expect(p.pada).toBeLessThanOrEqual(4);
    }
  });

  it("reports the same Moon nakshatra as the planet table", () => {
    const c = computeKundli(BIRTH);
    const moon = c.planets.find((p) => p.name === "Moon")!;
    expect(c.moonNakshatra.index).toBe(moon.nakshatra);
    expect(c.moonNakshatra.pada).toBe(moon.pada);
    expect(NAKSHATRAS[c.moonNakshatra.index]).toBeTruthy();
  });

  it("passes the curated reference chart suite", () => {
    const report = runValidationSuite();
    expect(report.failed, JSON.stringify(report.cases, null, 2)).toBe(0);
    expect(report.passed).toBeGreaterThan(0);
  });
});

describe("Transit / current-sky engine", () => {
  it("uses the same chart engine and is stable for a fixed instant", () => {
    const sky = (at: Date) =>
      computeKundli({
        year: at.getUTCFullYear(), month: at.getUTCMonth() + 1, day: at.getUTCDate(),
        hour: at.getUTCHours(), minute: at.getUTCMinutes(),
        tzOffsetHours: 0, latitude: BIRTH.latitude, longitude: BIRTH.longitude,
      });
    expect(JSON.stringify(sky(FIXED_NOW))).toBe(JSON.stringify(sky(new Date(FIXED_NOW))));
  });

  it("moves the Moon forward in time (no frozen transits)", () => {
    const later = new Date(FIXED_NOW.getTime() + 6 * 3600_000);
    const a = computeNakshatraForLocation({ date: FIXED_NOW, latitude: BIRTH.latitude, longitude: BIRTH.longitude });
    const b = computeNakshatraForLocation({ date: later, latitude: BIRTH.latitude, longitude: BIRTH.longitude });
    expect(a.moon.degInNak).not.toBeCloseTo(b.moon.degInNak, 4);
  });
});

describe("Nakshatra engine", () => {
  it("is deterministic and agrees with the Kundli engine at the same instant", () => {
    const snap = computeNakshatraForLocation({
      date: FIXED_NOW, latitude: BIRTH.latitude, longitude: BIRTH.longitude,
    });
    const again = computeNakshatraForLocation({
      date: new Date(FIXED_NOW), latitude: BIRTH.latitude, longitude: BIRTH.longitude,
    });
    expect(again.moon.index).toBe(snap.moon.index);
    expect(again.moon.pada).toBe(snap.moon.pada);

    const chart = computeKundli({
      year: FIXED_NOW.getUTCFullYear(), month: FIXED_NOW.getUTCMonth() + 1, day: FIXED_NOW.getUTCDate(),
      hour: FIXED_NOW.getUTCHours(), minute: FIXED_NOW.getUTCMinutes(),
      tzOffsetHours: 0, latitude: BIRTH.latitude, longitude: BIRTH.longitude,
    });
    expect(snap.moon.index).toBe(chart.moonNakshatra.index);
    expect(snap.moon.pada).toBe(chart.moonNakshatra.pada);
  });

  it("keeps index, name, pada and progress consistent", () => {
    const snap = computeNakshatraForLocation({
      date: FIXED_NOW, latitude: BIRTH.latitude, longitude: BIRTH.longitude,
    });
    expect(snap.moon.name).toBe(NAKSHATRAS[snap.moon.index]);
    expect(snap.moon.pada).toBe(Math.min(4, Math.floor(snap.moon.degInNak / (360 / 27 / 4)) + 1));
    expect(snap.moon.progress).toBeGreaterThanOrEqual(0);
    expect(snap.moon.progress).toBeLessThanOrEqual(1);
  });
});

describe("Vimshottari dasha engine", () => {
  const chart = computeKundli(BIRTH);
  const moon = chart.planets.find((p) => p.name === "Moon")!;
  const degInNak = moon.longitude % (360 / 27);
  const birthDate = new Date(Date.UTC(1990, 4, 12, 9, 5)); // 14:35 IST

  it("is built from the same Moon nakshatra the chart reports", () => {
    const tree = computeVimshottari(birthDate, chart.moonNakshatra.index, degInNak);
    const same = computeVimshottari(birthDate, moon.nakshatra, degInNak);
    expect(tree.currentMaha.lord).toBe(same.currentMaha.lord);
  });

  it("produces a gapless, non-overlapping, deterministic timeline", () => {
    const tree = computeVimshottari(birthDate, chart.moonNakshatra.index, degInNak);
    expect(tree.maha.length).toBeGreaterThan(0);
    for (let i = 1; i < tree.maha.length; i++) {
      expect(tree.maha[i].start.getTime()).toBe(tree.maha[i - 1].end.getTime());
      expect(tree.maha[i].end.getTime()).toBeGreaterThan(tree.maha[i].start.getTime());
    }
    // Current periods must nest correctly: pratyantar ⊂ antar ⊂ maha.
    expect(tree.currentAntar.start.getTime()).toBeGreaterThanOrEqual(tree.currentMaha.start.getTime());
    expect(tree.currentAntar.end.getTime()).toBeLessThanOrEqual(tree.currentMaha.end.getTime());
    expect(tree.currentPratyantar.start.getTime()).toBeGreaterThanOrEqual(tree.currentAntar.start.getTime());
    expect(tree.currentPratyantar.end.getTime()).toBeLessThanOrEqual(tree.currentAntar.end.getTime());

    const rerun = computeVimshottari(birthDate, chart.moonNakshatra.index, degInNak);
    expect(rerun.currentMaha.lord).toBe(tree.currentMaha.lord);
    expect(rerun.currentAntar.lord).toBe(tree.currentAntar.lord);
  });
});

describe("Numerology engine", () => {
  const input = { fullName: "John Doe", birthDate: "1985-02-18", now: FIXED_NOW };

  it("is deterministic and never contradicts lifePathNumber()", () => {
    const a = computeNumerology(input);
    const b = computeNumerology({ ...input });
    expect(b).toEqual(a);
    expect(a.lifePath).toBe(lifePathNumber(input.birthDate));
  });

  it("keeps every core value in a valid range", () => {
    const r = computeNumerology(input);
    const valid = (n: number) => (n >= 1 && n <= 9) || n === 11 || n === 22 || n === 33;
    for (const n of [r.lifePath, r.destiny, r.soulUrge, r.personality, r.birthday, r.maturity]) {
      expect(valid(n)).toBe(true);
    }
    // Personal cycles are always 1..9 (no master numbers) so they can't clash.
    for (const n of [r.personalYear, r.personalMonth, r.personalDay]) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(9);
    }
    expect(r.pinnacles).toHaveLength(4);
    expect(r.challenges).toHaveLength(4);
    r.challenges.forEach((c) => { expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThanOrEqual(8); });
  });

  it("derives maturity, master numbers and karmic debts from the same core values", () => {
    const r = computeNumerology(input);
    expect(r.maturity).toBe(reduce(r.lifePath + r.destiny, true));
    r.masterNumbers.forEach((n) => expect([11, 22, 33]).toContain(n));
    r.karmicDebts.forEach((n) => expect([13, 14, 16, 19]).toContain(n));
    expect(r.destiny).toBe(reduce(r.destinyCompound, true));
    expect(r.soulUrge).toBe(reduce(r.soulUrgeCompound, true));
    expect(r.personality).toBe(reduce(r.personalityCompound, true));
  });

  it("detects karmic debt and master numbers on known reference dates", () => {
    // 16 Nov 1979 → day 16 is a karmic debt day.
    expect(computeNumerology({ fullName: "A B", birthDate: "1979-11-16", now: FIXED_NOW }).karmicDebts)
      .toContain(16);
    // 4 Oct 1968 → life path 11 (master preserved).
    const master = computeNumerology({ fullName: "A B", birthDate: "1968-10-04", now: FIXED_NOW });
    expect(master.lifePath).toBe(11);
    expect(master.masterNumbers).toContain(11);
  });

  it("gives the same personal year/month/day for the same day", () => {
    const a = computeNumerology(input);
    const b = computeNumerology({ ...input, now: new Date(FIXED_NOW) });
    expect([b.personalYear, b.personalMonth, b.personalDay])
      .toEqual([a.personalYear, a.personalMonth, a.personalDay]);
  });

  it("stays identical between Pythagorean runs but may differ by system", () => {
    const p1 = computeNumerology(input, "Pythagorean");
    const p2 = computeNumerology(input, "Pythagorean");
    expect(p2).toEqual(p1);
    const c = computeNumerology(input, "Chaldean");
    expect(c.lifePath).toBe(p1.lifePath); // date-based values never vary by system
    expect(c.birthday).toBe(p1.birthday);
    expect(c.personalYear).toBe(p1.personalYear);
  });
});

describe("AI reading formatting (tarot, astrology, reports)", () => {
  const messy = [
    "## Past **Position**",
    "* The `Fool` starts a _journey_.",
    "- Moon at 12.5 deg | Ayanamsa 24",
    "[Read more](https://x.test)",
  ].join("\n");

  it("strips every markdown symbol from model output", () => {
    const out = toPlainText(messy);
    for (const ch of ["*", "#", "`", ">", "|", "~", "[", "]"]) {
      expect(out.includes(ch), `found ${ch}`).toBe(false);
    }
    expect(out).toContain("Fool");
  });

  it("parses into simple heading / bullet / text lines", () => {
    const lines = parsePlainLines("🎴 Your cards\n• A fresh start is near.\nKeep it simple.");
    expect(lines[0].kind).toBe("heading");
    expect(lines[1].kind).toBe("bullet");
    expect(lines[2].kind).toBe("text");
  });

  it("applies the same plain-English rules to every AI surface", () => {
    for (const moduleSystem of ["Tarot reader.", "Astrology reader.", "Numerology reader.", ""]) {
      const prompt = withSupremeSystem(moduleSystem);
      expect(prompt).toContain(PLAIN_ELI10_RULES);
      // Rules must forbid exposing internal calculations unless asked.
      expect(prompt).toContain("Never show internal workings");
      expect(prompt.trim().endsWith(PLAIN_ELI10_RULES) || prompt.includes(PLAIN_ELI10_RULES)).toBe(true);
    }
  });

  it("keeps the output style block last so it wins over module prompts", () => {
    const prompt = withSupremeSystem("Tarot reader.");
    expect(prompt.indexOf(PLAIN_ELI10_RULES)).toBeGreaterThan(prompt.indexOf("Tarot reader."));
  });
});

describe("No Roman numerals anywhere in engine output", () => {
  const ROMAN = /\b(?:I{2,3}|IV|VI{0,3}|IX|XI{0,3}|XIV|XV|XVI{0,3}|XIX|XX|XXI)\b/;

  it("chart, dasha and numerology outputs use Arabic numerals only", () => {
    const chart = computeKundli(BIRTH);
    const moon = chart.planets.find((p) => p.name === "Moon")!;
    const dasha = computeVimshottari(new Date(Date.UTC(1990, 4, 12, 9, 5)), moon.nakshatra, moon.longitude % (360 / 27));
    const num = computeNumerology({ fullName: "John Doe", birthDate: "1985-02-18", now: FIXED_NOW });
    const blobs = [JSON.stringify(chart), JSON.stringify(dasha.maha.map((m) => m.lord)), JSON.stringify(num)];
    for (const blob of blobs) expect(ROMAN.test(blob)).toBe(false);
  });
});
