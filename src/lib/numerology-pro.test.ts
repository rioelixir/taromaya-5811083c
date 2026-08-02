import { describe, it, expect } from "vitest";
import { nameChart, nameHarmony, spellingOptions, COMPOUND_MEANINGS } from "@/lib/name-numerology-pro";
import {
  birthNumbers, mahadashaTimeline, subPeriods, dashaAt, personalCycles,
  predictForDate, multiYearForecast, currentGrid, practicalGuidance, orderFrom,
} from "@/lib/numerology-dasha";
import { kabbalahReading, HEBREW_LETTERS, letterForCard } from "@/lib/kabbalah-tarot";
import { nadiReading, nadiDoshaCheck, nadiAmsaOf } from "@/lib/nadi";

describe("Chaldean name chart", () => {
  it("uses sound values and reads the compound total", () => {
    const c = nameChart("Aryan Sharma", "Chaldean");
    // A1 R2 Y1 A1 N5 = 10 ; S3 H5 A1 R2 M4 A1 = 16
    expect(c.words[0]!.compound).toBe(10);
    expect(c.words[1]!.compound).toBe(16);
    expect(c.compound).toBe(26);
    expect(c.root).toBe(8);
    expect(c.compoundMeaning).toBe(COMPOUND_MEANINGS[26]);
    expect(c.missingValues).not.toContain(1);
  });
  it("never assigns 9 to a Chaldean letter", () => {
    const c = nameChart("Zoe Quinn Wolf Xavier", "Chaldean");
    expect(c.cells.every((x) => x.value >= 1 && x.value <= 8)).toBe(true);
  });
  it("Pythagorean keeps master numbers on reduction", () => {
    const c = nameChart("Aa", "Pythagorean");
    expect(c.compound).toBe(2);
    expect(nameChart("Kk", "Pythagorean").root).toBe(4);
  });
  it("harmony penalises enemy pairs", () => {
    expect(nameHarmony(8, 1, 1).withMulank).toBe("enemy");
    expect(nameHarmony(3, 1, 1).score).toBeGreaterThan(nameHarmony(8, 1, 1).score);
  });
  it("spelling options keep the base letters recognisable", () => {
    const s = spellingOptions("Aryan Sharma", 6, 8, "Chaldean");
    expect(s.current.spelling).toBe("ARYAN SHARMA");
    for (const o of [...s.better, ...s.avoid]) {
      expect(o.spelling.split(" ").length).toBe(2);
      expect(Math.abs(o.spelling.length - s.current.spelling.length)).toBeLessThanOrEqual(1);
    }
  });
});

describe("numerology period ladder", () => {
  const birth = "1995-06-15";
  it("starts at the mulank and runs 1..9 with year lengths equal to the lord", () => {
    const b = birthNumbers(birth);
    expect(b.mulank).toBe(6);
    expect(b.bhagyank).toBe(9);
    expect(orderFrom(6)).toEqual([6, 7, 8, 9, 1, 2, 3, 4, 5]);
    const t = mahadashaTimeline(birth, 50);
    expect(t[0]!.lord).toBe(6);
    expect(t[0]!.years).toBeCloseTo(6, 5);
    expect(t[1]!.lord).toBe(7);
    expect(t[0]!.end.getTime()).toBe(t[1]!.start.getTime());
  });
  it("sub-periods fill the parent exactly and start with the parent lord", () => {
    const maha = mahadashaTimeline(birth, 20)[0]!;
    const subs = subPeriods(maha, "antar");
    expect(subs).toHaveLength(9);
    expect(subs[0]!.lord).toBe(maha.lord);
    expect(subs[8]!.end.getTime()).toBeCloseTo(maha.end.getTime(), -1);
    const total = subs.reduce((s, p) => s + (p.end.getTime() - p.start.getTime()), 0);
    expect(total).toBeCloseTo(maha.end.getTime() - maha.start.getTime(), -1);
  });
  it("resolves three levels for a given date", () => {
    const at = dashaAt(birth, new Date("2026-08-02T00:00:00Z"))!;
    expect(at.maha.lord).toBeGreaterThanOrEqual(1);
    expect(at.antar.start.getTime()).toBeGreaterThanOrEqual(at.maha.start.getTime());
    expect(at.pratyantar.end.getTime()).toBeLessThanOrEqual(at.antar.end.getTime() + 1);
  });
  it("personal cycles are single digits", () => {
    const c = personalCycles(birth, new Date("2026-08-02T00:00:00Z"));
    for (const n of [c.personalYear, c.personalMonth, c.personalDay, c.universalYear]) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(9);
    }
    // 6 + 6 (birth day 15 -> 6) + 1 (2026 -> 1) = 13 -> 4
    expect(c.personalYear).toBe(4);
  });
  it("date prediction and forecast stay consistent", () => {
    const p = predictForDate(birth, "2030-03-09");
    expect(p.maha).not.toBeNull();
    expect(p.summary).not.toMatch(/[*#]/);
    const rows = multiYearForecast(birth, 2026, 5);
    expect(rows).toHaveLength(5);
    expect(rows[0]!.personalYear).toBe(4);
  });
  it("current grid and guidance are complete", () => {
    const g = currentGrid(birth, new Date("2026-08-02T00:00:00Z"));
    expect(g.activeNumbers.length + g.missingNumbers.length).toBe(9);
    expect(practicalGuidance(birth).length).toBeGreaterThanOrEqual(9);
  });
  it("rejects a bad date", () => {
    expect(() => birthNumbers("1995-02-30")).toThrow();
  });
});

describe("Hebrew letters and tarot", () => {
  it("covers 22 letters and 22 majors on paths 11..32", () => {
    expect(HEBREW_LETTERS).toHaveLength(22);
    expect(new Set(HEBREW_LETTERS.map((l) => l.card)).size).toBe(22);
    expect(HEBREW_LETTERS.map((l) => l.path)).toEqual(
      Array.from({ length: 22 }, (_, i) => 11 + i),
    );
    expect(HEBREW_LETTERS.map((l) => l.cardNumber)).toEqual(
      Array.from({ length: 22 }, (_, i) => i),
    );
    expect(letterForCard(0)!.name).toBe("Aleph");
    expect(letterForCard(21)!.name).toBe("Tav");
  });
  it("computes gematria with digraphs", () => {
    // SH(300) A(1) R(200) M(40) A(1) = 542
    expect(kabbalahReading("Sharma").total).toBe(542);
    const r = kabbalahReading("Sharma");
    expect(r.pathIndex).toBeGreaterThanOrEqual(1);
    expect(r.pathIndex).toBeLessThanOrEqual(22);
    expect(r.summary).not.toMatch(/[*#]/);
  });
});

describe("nadi engine", () => {
  it("divides each sign into 150 amsas of 12 arc minutes", () => {
    expect(nadiAmsaOf(0).inSignIndex).toBe(1);
    expect(nadiAmsaOf(29.99).inSignIndex).toBe(150);
    expect(nadiAmsaOf(30).zodiacIndex).toBe(151);
    expect(nadiAmsaOf(359.9).zodiacIndex).toBe(1800);
  });
  it("reads nadi type, leaf address and Bhrigu Bindu", () => {
    const r = nadiReading({
      year: 1995, month: 6, day: 15, hour: 7, minute: 45,
      tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.209,
    });
    expect(["Adi", "Madhya", "Antya"]).toContain(r.nadi);
    expect(r.moonAmsa.inSignIndex).toBeGreaterThanOrEqual(1);
    expect(r.moonAmsa.inSignIndex).toBeLessThanOrEqual(150);
    expect(r.leafGroup).toMatch(/kandam \d of 5/);
    expect(r.bhriguBindu.longitude).toBeGreaterThanOrEqual(0);
    expect(r.bhriguBindu.longitude).toBeLessThan(360);
    expect(r.method.length).toBeGreaterThan(3);
  });
  it("flags nadi dosha only when both share the nadi", () => {
    expect(nadiDoshaCheck(0, 0).dosha).toBe(true);
    expect(nadiDoshaCheck(0, 1).dosha).toBe(false);
  });
});
